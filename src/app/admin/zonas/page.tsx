import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ZonasManager } from '@/components/admin/zonas-manager'
import type { ZonaEnvio } from '@/types/db'

export const metadata = { title: 'Zonas de envío' }

async function getZonasAdmin(): Promise<ZonaEnvio[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('zonas_envio').select('*').order('orden', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

export default async function AdminZonasPage() {
  const zonas = await getZonasAdmin()

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Zonas de envío</h1>
      <p className="mt-1 text-muted-foreground">
        Costo manual por zona (Fase 4a). La integración real con Andreani llega cuando haya
        contrato comercial.
      </p>

      <div className="mt-6">
        <ZonasManager zonasIniciales={zonas} />
      </div>
    </div>
  )
}
