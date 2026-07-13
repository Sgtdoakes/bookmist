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

// Dos ambientes con estado de mantenimiento independiente: "producción" (el
// dominio real que ven los clientes) y "pruebas" (bookmist.vercel.app y
// cualquier otra URL de preview de Vercel para este proyecto). Activar/
// desactivar uno nunca toca al otro — son dos toggles separados aunque
// vivan en la misma tabla `configuracion`, con distinta clave.
export type Entorno = 'produccion' | 'pruebas'

export function entornoDeHost(host: string): Entorno {
  return host.endsWith('.vercel.app') ? 'pruebas' : 'produccion'
}

function claves(entorno: Entorno) {
  const sufijo = entorno === 'pruebas' ? '_pruebas' : ''
  return {
    activo: `mantenimiento_activo${sufijo}`,
    motivo: `mantenimiento_motivo${sufijo}`,
    mensaje: `mantenimiento_mensaje${sufijo}`,
  }
}

export type ModoMantenimiento = { activo: boolean; mensaje: string }

// Lectura pública (proxy + página de mantenimiento). Degrada a "apagado" si
// Supabase no está configurado o la consulta falla — nunca tapa el sitio por
// error.
export async function getModoMantenimiento(entorno: Entorno = 'produccion'): Promise<ModoMantenimiento> {
  if (!configured()) return { activo: false, mensaje: MENSAJE_POR_DEFECTO }
  const { activo: claveActivo, mensaje: claveMensaje } = claves(entorno)
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', [claveActivo, claveMensaje])
    if (error) throw error
    const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
    return {
      activo: map.get(claveActivo) === 'true',
      mensaje: map.get(claveMensaje)?.trim() || MENSAJE_POR_DEFECTO,
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
// decidirTransicionMantenimiento(). Siempre sobre el ambiente de
// "producción" — la falta de stock real de la tienda no tiene por qué
// afectar al ambiente de pruebas de bookmist.vercel.app.
export async function verificarAutoMantenimiento(supabase: SupabaseClient<Database>): Promise<void> {
  const { activo: claveActivo, motivo: claveMotivo } = claves('produccion')

  const { data: productos } = await supabase.from('productos').select('stock').eq('activo', true)
  const hayStock = (productos ?? []).some((p) => p.stock > 0)
  const hayProductos = (productos ?? []).length > 0

  const activoActual = (await leerValor(supabase, claveActivo)) === 'true'
  const motivoActual = await leerValor(supabase, claveMotivo)

  const decision = decidirTransicionMantenimiento({ activoActual, motivoActual, hayProductos, hayStock })

  if (decision.accion === 'activar') {
    await guardarValor(supabase, claveActivo, 'true')
    await guardarValor(supabase, claveMotivo, decision.motivo)
  } else if (decision.accion === 'desactivar') {
    await guardarValor(supabase, claveActivo, 'false')
  }
}

export async function activarMantenimientoManual(
  supabase: SupabaseClient<Database>,
  entorno: Entorno,
  mensaje?: string,
): Promise<void> {
  const { activo, motivo, mensaje: claveMensaje } = claves(entorno)
  await guardarValor(supabase, activo, 'true')
  await guardarValor(supabase, motivo, 'manual')
  if (mensaje?.trim()) await guardarValor(supabase, claveMensaje, mensaje.trim())
}

export async function desactivarMantenimiento(supabase: SupabaseClient<Database>, entorno: Entorno): Promise<void> {
  const { activo } = claves(entorno)
  await guardarValor(supabase, activo, 'false')
}
