import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMarcaConfig } from '@/lib/configuracion'
import { PedidosManager } from '@/components/admin/pedidos-manager'
import type { OrderConItems } from '@/types/db'

export const metadata = { title: 'Pedidos' }

async function getPedidos(): Promise<OrderConItems[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as OrderConItems[]) ?? []
  } catch {
    return []
  }
}

export default async function AdminPedidosPage() {
  const [pedidos, marca] = await Promise.all([getPedidos(), getMarcaConfig()])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Pedidos</h1>
      <p className="mt-1 text-muted-foreground">
        Los pedidos que entran desde la tienda. Cambiá el estado a medida que confirmás el pago.
      </p>

      <div className="mt-6">
        <PedidosManager pedidos={pedidos} marca={marca} />
      </div>
    </div>
  )
}
