import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import { verificarAutoMantenimiento } from '@/lib/mantenimiento'

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
