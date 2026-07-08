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

// Cuentas para transferencia/depósito bancario (Fase 6g) — una lista, no una
// sola cuenta: en Argentina es normal ofrecer varios destinos (distintos
// bancos/billeteras) para que quien paga evite comisiones entre bancos.
// Vive en una sola clave KV como JSON (mismo patrón que
// `marca_metodos_pago`) — no hace falta una tabla nueva para esto.
export type CuentaPago = {
  id: string
  etiqueta: string
  banco: string
  alias: string
  cbu: string
  titular: string
}

const CLAVE_CUENTAS_PAGO = 'pago_cuentas'

function cuentaVacia(): CuentaPago {
  return { id: crypto.randomUUID(), etiqueta: '', banco: '', alias: '', cbu: '', titular: '' }
}

function parseCuentas(valor: string | undefined): CuentaPago[] {
  if (!valor) return []
  try {
    const arr = JSON.parse(valor)
    if (!Array.isArray(arr)) return []
    return arr.map((c) => ({ ...cuentaVacia(), ...c }))
  } catch {
    return []
  }
}

export async function getCuentasPago(): Promise<CuentaPago[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', CLAVE_CUENTAS_PAGO)
      .maybeSingle()
    if (error) throw error
    return parseCuentas(data?.valor)
  } catch {
    return []
  }
}

// Una cuenta sirve para mandar plata real con solo CBU o alias — el titular
// es un dato de más (el banco de quien envía ya lo muestra solo), así que
// no bloquea que se muestre.
export function cuentaValida(c: CuentaPago): boolean {
  return !!c.cbu || !!c.alias
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
