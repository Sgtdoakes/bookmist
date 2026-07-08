import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/public'
import { storeConfig } from '@/lib/store-config'
import { NAV_LINKS } from '@/lib/constants'
import type { Database } from '@/types/db'

// Configuración de marca editable desde /admin/configuracion (Fase 6f-1):
// vive en la tabla `configuracion` (KV, ya existe desde la Fase 5 para el
// modo mantenimiento) con claves `marca_*`. Si falta una clave, la fila o
// Supabase no está configurado, cada campo cae a su default (los valores
// actuales de `storeConfig`/NAV_LINKS) — el sitio nunca se rompe por esto,
// mismo criterio que `getSeccionesPagina`/`getModoMantenimiento`.

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

export type MarcaConfig = {
  nombre: string
  taglineHeader: string
  taglineFooter: string
  copyright: string
  email: string
  whatsapp: string
  instagram: string
  instagramHandle: string
  tiktok: string
  // null = usa la paleta fija de globals.css, sin override.
  colorPrimario: string | null
  colorSecundario: string | null
  colorAcento: string | null
  metodosPago: string[]
  metodosEnvio: string[]
}

const CLAVES_MARCA = [
  'marca_nombre',
  'marca_tagline_header',
  'marca_tagline_footer',
  'marca_copyright',
  'marca_email',
  'marca_whatsapp',
  'marca_instagram_url',
  'marca_instagram_handle',
  'marca_tiktok_url',
  'marca_color_primario',
  'marca_color_secundario',
  'marca_color_acento',
  'marca_metodos_pago',
  'marca_metodos_envio',
] as const

const DEFAULTS_METODOS_PAGO = ['Transferencia', 'Efectivo', 'Mercado Pago']
const DEFAULTS_METODOS_ENVIO = ['Andreani']

function defaults(): MarcaConfig {
  return {
    nombre: storeConfig.nombre,
    taglineHeader: 'Editorial',
    taglineFooter: 'Historias que se sienten en las manos',
    copyright: 'Hecho con calma y buena tinta.',
    email: storeConfig.email,
    whatsapp: storeConfig.whatsapp,
    instagram: storeConfig.instagram,
    instagramHandle: storeConfig.instagramHandle,
    tiktok: storeConfig.tiktok,
    colorPrimario: null,
    colorSecundario: null,
    colorAcento: null,
    metodosPago: DEFAULTS_METODOS_PAGO,
    metodosEnvio: DEFAULTS_METODOS_ENVIO,
  }
}

function parseListaTexto(valor: string | undefined, fallback: string[]): string[] {
  if (!valor) return fallback
  try {
    const arr = JSON.parse(valor)
    return Array.isArray(arr) && arr.length > 0 && arr.every((v) => typeof v === 'string') ? arr : fallback
  } catch {
    return fallback
  }
}

export async function getMarcaConfig(): Promise<MarcaConfig> {
  const base = defaults()
  if (!configured()) return base
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('configuracion').select('clave, valor').in('clave', CLAVES_MARCA)
    if (error) throw error
    const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
    return {
      nombre: map.get('marca_nombre')?.trim() || base.nombre,
      taglineHeader: map.get('marca_tagline_header')?.trim() || base.taglineHeader,
      taglineFooter: map.get('marca_tagline_footer')?.trim() || base.taglineFooter,
      copyright: map.get('marca_copyright')?.trim() || base.copyright,
      email: map.get('marca_email')?.trim() || base.email,
      whatsapp: map.get('marca_whatsapp')?.trim() ?? base.whatsapp,
      instagram: map.get('marca_instagram_url')?.trim() || base.instagram,
      instagramHandle: map.get('marca_instagram_handle')?.trim() || base.instagramHandle,
      tiktok: map.get('marca_tiktok_url')?.trim() || base.tiktok,
      colorPrimario: map.get('marca_color_primario')?.trim() || null,
      colorSecundario: map.get('marca_color_secundario')?.trim() || null,
      colorAcento: map.get('marca_color_acento')?.trim() || null,
      metodosPago: parseListaTexto(map.get('marca_metodos_pago'), base.metodosPago),
      metodosEnvio: parseListaTexto(map.get('marca_metodos_envio'), base.metodosEnvio),
    }
  } catch {
    return base
  }
}

// Datos de transferencia/depósito bancario (Fase 6g) — mismas claves KV que
// marca, para que el checkout pueda cerrar el pago ahí mismo en vez de
// "te contactamos para coordinar". Se guarda siempre (aunque esté
// incompleto, para que el admin pueda ver/editar lo que ya cargó) — quien
// consume el dato públicamente debe chequear transferenciaCompleta() antes
// de mostrarlo/habilitar la opción, así nunca se expone una cuenta a medio
// cargar.
export type DatosTransferencia = {
  titular: string
  cbu: string
  alias: string
  banco: string
}

const CLAVES_TRANSFERENCIA = [
  'pago_transferencia_titular',
  'pago_transferencia_cbu',
  'pago_transferencia_alias',
  'pago_transferencia_banco',
] as const

export async function getDatosTransferencia(): Promise<DatosTransferencia> {
  const vacio: DatosTransferencia = { titular: '', cbu: '', alias: '', banco: '' }
  if (!configured()) return vacio
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', CLAVES_TRANSFERENCIA)
    if (error) throw error
    const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
    return {
      titular: map.get('pago_transferencia_titular')?.trim() ?? '',
      cbu: map.get('pago_transferencia_cbu')?.trim() ?? '',
      alias: map.get('pago_transferencia_alias')?.trim() ?? '',
      banco: map.get('pago_transferencia_banco')?.trim() ?? '',
    }
  } catch {
    return vacio
  }
}

// Un titular + (CBU o alias) es lo mínimo para que alguien pueda mandar
// plata de verdad — sin esto, mostrar la opción sería otra promesa vacía.
export function transferenciaCompleta(d: DatosTransferencia): boolean {
  return !!d.titular && (!!d.cbu || !!d.alias)
}

export type NavLinkPublico = { label: string; href: string }

const NAV_LINKS_POR_DEFECTO: NavLinkPublico[] = NAV_LINKS.map((l) => ({ label: l.label, href: l.href }))

export async function getNavLinks(): Promise<NavLinkPublico[]> {
  if (!configured()) return NAV_LINKS_POR_DEFECTO
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('nav_links')
      .select('label, href')
      .eq('activo', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data && data.length > 0 ? data : NAV_LINKS_POR_DEFECTO
  } catch {
    return NAV_LINKS_POR_DEFECTO
  }
}

// Escritura (admin, ya autenticado) — upsert de un lote de claves/valores en
// una sola llamada. Usado por guardarMarcaConfig en
// src/app/admin/configuracion/actions.ts.
export async function guardarValoresConfiguracion(
  supabase: SupabaseClient<Database>,
  valores: Record<string, string>,
): Promise<void> {
  const filas = Object.entries(valores).map(([clave, valor]) => ({
    clave,
    valor,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('configuracion').upsert(filas)
  if (error) throw error
}
