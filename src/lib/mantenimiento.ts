import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/public'
import type { Database } from '@/types/db'

const MENSAJE_POR_DEFECTO =
  'Estamos reponiendo stock. Volvemos en unas horas — mientras tanto, seguinos en Instagram para enterarte apenas volvamos.'

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export type ModoMantenimiento = { activo: boolean; mensaje: string }

// Lectura pública (proxy + página de mantenimiento). Degrada a "apagado" si
// Supabase no está configurado o la consulta falla — nunca tapa el sitio por
// error.
export async function getModoMantenimiento(): Promise<ModoMantenimiento> {
  if (!configured()) return { activo: false, mensaje: MENSAJE_POR_DEFECTO }
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['mantenimiento_activo', 'mantenimiento_mensaje'])
    if (error) throw error
    const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
    return {
      activo: map.get('mantenimiento_activo') === 'true',
      mensaje: map.get('mantenimiento_mensaje')?.trim() || MENSAJE_POR_DEFECTO,
    }
  } catch {
    return { activo: false, mensaje: MENSAJE_POR_DEFECTO }
  }
}

async function leerValor(
  supabase: SupabaseClient<Database>,
  clave: string,
): Promise<string | null> {
  const { data } = await supabase.from('configuracion').select('valor').eq('clave', clave).maybeSingle()
  return data?.valor ?? null
}

async function guardarValor(supabase: SupabaseClient<Database>, clave: string, valor: string) {
  await supabase
    .from('configuracion')
    .upsert({ clave, valor, updated_at: new Date().toISOString() })
}

export type DecisionMantenimiento =
  | { accion: 'activar'; motivo: 'auto_sin_stock' }
  | { accion: 'desactivar' }
  | { accion: 'nada' }

// Función pura (sin acceso a datos) con la regla de negocio: cuándo el
// chequeo automático debe activar o desactivar el modo mantenimiento. Nunca
// pisa una activación 'manual' de Daniela — solo actúa si el estado actual
// quedó así por el propio chequeo automático (o todavía está apagado).
export function decidirTransicionMantenimiento(datos: {
  activoActual: boolean
  motivoActual: string | null
  hayProductos: boolean
  hayStock: boolean
}): DecisionMantenimiento {
  const { activoActual, motivoActual, hayProductos, hayStock } = datos

  if (!activoActual && hayProductos && !hayStock) {
    return { accion: 'activar', motivo: 'auto_sin_stock' }
  }
  if (activoActual && motivoActual === 'auto_sin_stock' && hayStock) {
    return { accion: 'desactivar' }
  }
  return { accion: 'nada' }
}

// Se llama después de cualquier cambio de stock (pedido pagado/cancelado,
// edición manual desde el admin): lee el estado real y aplica la decisión de
// decidirTransicionMantenimiento().
export async function verificarAutoMantenimiento(supabase: SupabaseClient<Database>): Promise<void> {
  const { data: productos } = await supabase.from('productos').select('stock').eq('activo', true)
  const hayStock = (productos ?? []).some((p) => p.stock > 0)
  const hayProductos = (productos ?? []).length > 0

  const activoActual = (await leerValor(supabase, 'mantenimiento_activo')) === 'true'
  const motivoActual = await leerValor(supabase, 'mantenimiento_motivo')

  const decision = decidirTransicionMantenimiento({ activoActual, motivoActual, hayProductos, hayStock })

  if (decision.accion === 'activar') {
    await guardarValor(supabase, 'mantenimiento_activo', 'true')
    await guardarValor(supabase, 'mantenimiento_motivo', decision.motivo)
  } else if (decision.accion === 'desactivar') {
    await guardarValor(supabase, 'mantenimiento_activo', 'false')
  }
}

export async function activarMantenimientoManual(
  supabase: SupabaseClient<Database>,
  mensaje?: string,
): Promise<void> {
  await guardarValor(supabase, 'mantenimiento_activo', 'true')
  await guardarValor(supabase, 'mantenimiento_motivo', 'manual')
  if (mensaje?.trim()) await guardarValor(supabase, 'mantenimiento_mensaje', mensaje.trim())
}

export async function desactivarMantenimiento(supabase: SupabaseClient<Database>): Promise<void> {
  await guardarValor(supabase, 'mantenimiento_activo', 'false')
}
