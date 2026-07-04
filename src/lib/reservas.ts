import { createAdminClient } from '@/lib/supabase/admin'
import type { EstadoPedido } from '@/types/db'

// Estados en los que un pedido "retiene" stock: no se canceló todavía.
const ESTADOS_ACTIVOS: EstadoPedido[] = ['pendiente', 'pagado']

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Unidades reservadas por producto (pedidos activos). Devuelve un mapa
// producto_id -> cantidad, solo con los productos que tienen reservas. Usa
// service-role (orders es admin-only por RLS). La disponibilidad real =
// stock − reservas_activas.
export async function getReservasActivas(productoIds?: string[]): Promise<Record<string, number>> {
  if (!configured()) return {}
  try {
    const supabase = createAdminClient()
    const { data: ordenes } = await supabase.from('orders').select('id').in('estado', ESTADOS_ACTIVOS)
    const orderIds = (ordenes ?? []).map((o) => o.id)
    if (orderIds.length === 0) return {}

    let q = supabase.from('order_items').select('producto_id, cantidad').in('order_id', orderIds)
    if (productoIds && productoIds.length) q = q.in('producto_id', productoIds)
    const { data } = await q

    const map: Record<string, number> = {}
    for (const r of data ?? []) {
      if (!r.producto_id) continue
      map[r.producto_id] = (map[r.producto_id] ?? 0) + (Number(r.cantidad) || 0)
    }
    return map
  } catch {
    return {}
  }
}
