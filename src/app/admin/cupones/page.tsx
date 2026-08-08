import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { contarUsosPorCupon } from '@/lib/cupon'
import { CuponesManager } from '@/components/admin/cupones-manager'
import type { Cupon } from '@/types/db'

export const metadata = { title: 'Cupones' }

async function getCupones(): Promise<{ cupones: Cupon[]; usos: Record<string, number> }> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cupones').select('*').order('created_at', { ascending: false })
  if (error) return { cupones: [], usos: {} }

  // Los usos se cuentan sobre orders.cupon_id (ver src/lib/cupon.ts): sin
  // esto la lista no puede mostrar el "12 de 30", que es justo lo que Dani
  // necesita mirar mientras reparte los papeles.
  let usos: Record<string, number> = {}
  try {
    usos = await contarUsosPorCupon(supabase)
  } catch {
    usos = {}
  }

  return { cupones: data ?? [], usos }
}

export default async function AdminCuponesPage() {
  const { cupones, usos } = await getCupones()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Cupones</h1>
      <p className="mt-1 text-muted-foreground">
        Generá una tanda para repartir, o cargá un código puntual a mano. Cada cupón se puede apagar en cualquier
        momento sin borrarlo.
      </p>

      <div className="mt-6">
        <CuponesManager cuponesIniciales={cupones} usosIniciales={usos} />
      </div>
    </div>
  )
}
