import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ZonasManager } from '@/components/admin/zonas-manager'
import { EnvioConfigForm } from '@/components/admin/envio-config-form'
import { getEnvioConfig } from '@/lib/configuracion'
import type { ZonaEnvio } from '@/types/db'

export const metadata = { title: 'Envíos' }

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
  const [zonas, envioConfig] = await Promise.all([getZonasAdmin(), getEnvioConfig()])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Envíos</h1>
      <p className="mt-1 text-muted-foreground">
        Envío gratis por monto, retiro en persona, y las zonas manuales que se usan de respaldo si
        la cotización de Andreani no está disponible.
      </p>

      <div className="mt-6">
        <EnvioConfigForm inicial={envioConfig} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Zonas de envío (respaldo)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Solo aparecen en el checkout si Andreani no puede cotizar.
      </p>
      <div className="mt-4">
        <ZonasManager zonasIniciales={zonas} />
      </div>
    </div>
  )
}
