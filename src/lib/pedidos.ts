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
export async function ajustarStockPedido(
  supabase: SupabaseClient<Database>,
  orderId: string,
  direccion: 1 | -1,
): Promise<void> {
  const { data: items } = await supabase
    .from('order_items')
    .select('producto_id, cantidad')
    .eq('order_id', orderId)

  for (const it of items ?? []) {
    if (!it.producto_id) continue
    const { data: producto } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', it.producto_id)
      .maybeSingle()
    if (!producto) continue
    const nuevo = Math.max(0, producto.stock + direccion * it.cantidad)
    await supabase.from('productos').update({ stock: nuevo }).eq('id', it.producto_id)
  }

  // El stock acaba de cambiar: revisamos si corresponde activar/desactivar
  // el modo "reponiendo stock" automático.
  await verificarAutoMantenimiento(supabase)
}
