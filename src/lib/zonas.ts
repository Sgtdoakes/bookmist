import { createClient } from '@/lib/supabase/public'
import type { ZonaEnvio } from '@/types/db'

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Zonas de envío activas, para el selector del checkout (costo manual por
// zona — Fase 4a; la API real de Andreani llega en la Fase 4b).
export async function getZonasEnvioActivas(): Promise<ZonaEnvio[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('zonas_envio')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}
