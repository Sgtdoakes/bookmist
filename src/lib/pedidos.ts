// Este módulo toca la base con service role: nunca puede terminar en el
// bundle del navegador. El `server-only` hace que un import por valor desde un
// componente cliente falle en el build en vez de filtrarse en silencio —
// exactamente lo que pasó con el token de Instagram en la Fase 6l. El tipo
// PedidoPublico sí lo importa un componente cliente, pero con `import type`,
// que se borra en compilación y nunca carga el módulo.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, EstadoPedido, MetodoPago } from '@/types/db'
import { verificarAutoMantenimiento } from '@/lib/mantenimiento'

// Lo que ve quien compró cuando abre el link de seguimiento. Es un subconjunto
// deliberado de la fila: NO salen el id interno, el token, los ids de Mercado
// Pago ni las notas — nada de eso le sirve, y cuanto menos viaje al navegador,
// menos hay que cuidar.
export type PedidoPublico = {
  numero_pedido: string
  estado: EstadoPedido
  estado_actualizado_at: string
  created_at: string
  cliente_nombre: string
  cliente_email: string
  direccion_envio: string
  zona_envio: string | null
  costo_envio: number | null
  metodo_pago: MetodoPago
  descuento: number
  cupon_codigo: string | null
  total: number
  seguimiento: string | null
  items: { nombre: string; cantidad: number; precio_unitario: number }[]
}

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Trae un pedido para su dueño, validando número + token juntos (migración
// 0033). Usa service role porque `orders` no tiene ninguna policy para anon
// (0005): el público nunca consulta la tabla directo, siempre pasa por acá.
//
// El token es lo único que autoriza. El número de pedido es correlativo, así
// que si alcanzara solo, cualquiera podría recorrer BM-0001, BM-0002... y
// leer nombre, dirección y DNI ajenos. Por eso el filtro va por los dos y la
// comparación la hace Postgres sobre una columna unique.
export async function getPedidoPublico(
  numeroPedido: string,
  token: string,
): Promise<PedidoPublico | null> {
  if (!configured()) return null
  if (!numeroPedido?.trim() || !token?.trim()) return null

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('orders')
      .select(
        'numero_pedido,estado,estado_actualizado_at,created_at,cliente_nombre,cliente_email,direccion_envio,zona_envio,costo_envio,metodo_pago,descuento,cupon_codigo,total,seguimiento,order_items(nombre,cantidad,precio_unitario)',
      )
      .eq('numero_pedido', numeroPedido.trim().toUpperCase())
      .eq('token_consulta', token.trim())
      .maybeSingle()
    if (error || !data) return null

    const { order_items, ...pedido } = data
    return { ...pedido, items: order_items ?? [] }
  } catch {
    // Un pedido que no se puede leer se comporta como uno que no existe: la
    // página cae a la confirmación genérica en vez de romper.
    return null
  }
}

// Ajusta productos.stock a partir de los ítems de un pedido. Se llama en dos
// momentos, desde el mismo lugar (server action del admin y webhook de
// Mercado Pago) para que la lógica nunca diverja entre los dos caminos:
//   - direccion = -1 al confirmar el pago (pendiente -> pagado): la caja/kit
//     ya se compromete a salir, se descuenta del stock físico.
//   - direccion = +1 si un pedido YA pagado se cancela (reembolso/problema):
//     se repone el stock, la caja/kit vuelve a estar disponible.
// (pendiente -> cancelado no toca stock: nunca se había descontado.)
//
// Devuelve false si ALGÚN paso falló (query o update): el webhook usa eso
// para responder 500 y que Mercado Pago reintente el aviso — un fallo
// silencioso acá es sobreventa (pasó de verdad con el pedido BM-0003: quedó
// pagado pero el stock nunca bajó, y con el 200 fijo MP no volvió a avisar).
export async function ajustarStockPedido(
  supabase: SupabaseClient<Database>,
  orderId: string,
  direccion: 1 | -1,
): Promise<boolean> {
  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('producto_id, cantidad')
    .eq('order_id', orderId)
  if (itemsErr) {
    console.error('[stock] no se pudieron leer los items del pedido', orderId, itemsErr.message)
    return false
  }

  let ok = true
  for (const it of items ?? []) {
    if (!it.producto_id) continue
    const { data: producto, error: prodErr } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', it.producto_id)
      .maybeSingle()
    if (prodErr) {
      console.error('[stock] no se pudo leer el producto', it.producto_id, prodErr.message)
      ok = false
      continue
    }
    if (!producto) continue // producto borrado: el item queda como snapshot, nada que ajustar
    const nuevo = Math.max(0, producto.stock + direccion * it.cantidad)
    const { error: updErr } = await supabase
      .from('productos')
      .update({ stock: nuevo })
      .eq('id', it.producto_id)
    if (updErr) {
      console.error('[stock] no se pudo actualizar el stock de', it.producto_id, updErr.message)
      ok = false
    }
  }

  // El stock acaba de cambiar: revisamos si corresponde activar/desactivar
  // el modo "reponiendo stock" automático. Best-effort: si esto falla no
  // amerita reintento del webhook (el stock ya quedó bien ajustado).
  try {
    await verificarAutoMantenimiento(supabase)
  } catch (e) {
    console.error('[stock] verificarAutoMantenimiento falló', e)
  }

  return ok
}
