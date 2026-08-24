import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/public'
import { storeConfig } from '@/lib/store-config'
import { NAV_LINKS } from '@/lib/constants'
import type { CintilloConfig } from '@/lib/cintillo'
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
  // null = usa el ícono decorativo fijo (BookDoodle) en vez de una imagen real.
  logoUrl: string | null
  // Versión para la pestaña del navegador (recorte apretado con contorno).
  // null = cae a logoUrl.
  faviconUrl: string | null
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
  'marca_logo_url',
  'marca_favicon_url',
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
    logoUrl: null,
    faviconUrl: null,
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
    // `??` vs `||`: los campos opcionales (taglines, redes, copyright) usan
    // `??` — si la clave existe con valor vacío es porque Dani lo VACIÓ a
    // propósito desde el admin, y el sitio debe mostrarlo vacío, no volver
    // al default (bug real: "guardo y no cambia nada"). El default solo
    // aplica si la clave nunca se guardó. Nombre y email usan `||` porque
    // vacíos no tienen sentido (siempre caen al default).
    return {
      nombre: map.get('marca_nombre')?.trim() || base.nombre,
      logoUrl: map.get('marca_logo_url')?.trim() || null,
      faviconUrl: map.get('marca_favicon_url')?.trim() || null,
      taglineHeader: map.get('marca_tagline_header')?.trim() ?? base.taglineHeader,
      taglineFooter: map.get('marca_tagline_footer')?.trim() ?? base.taglineFooter,
      copyright: map.get('marca_copyright')?.trim() ?? base.copyright,
      email: map.get('marca_email')?.trim() || base.email,
      whatsapp: map.get('marca_whatsapp')?.trim() ?? base.whatsapp,
      instagram: map.get('marca_instagram_url')?.trim() ?? base.instagram,
      instagramHandle: map.get('marca_instagram_handle')?.trim() ?? base.instagramHandle,
      tiktok: map.get('marca_tiktok_url')?.trim() ?? base.tiktok,
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

// Porcentaje de descuento por pagar con transferencia. Editable desde
// /admin/configuracion vía la clave `descuento_transferencia_pct`; default 5.
// 0 = sin descuento (el checkout cobra el precio de lista y el cartelito
// "% OFF" al lado de Transferencia desaparece solo).
const CLAVE_DESCUENTO_TRANSFERENCIA = 'descuento_transferencia_pct'
const DESCUENTO_TRANSFERENCIA_DEFAULT = 5

function parsePct(valor: string | undefined): number | null {
  if (!valor) return null
  const pct = Number(valor)
  return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null
}

export async function getDescuentoTransferenciaPct(): Promise<number> {
  if (!configured()) return DESCUENTO_TRANSFERENCIA_DEFAULT
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', CLAVE_DESCUENTO_TRANSFERENCIA)
      .maybeSingle()
    if (error) throw error
    // `?? DEFAULT` y no `|| DEFAULT`: un 0 guardado a propósito (descuento
    // apagado) tiene que quedar en 0, no volver al 5 de fábrica.
    return parsePct(data?.valor) ?? DESCUENTO_TRANSFERENCIA_DEFAULT
  } catch {
    return DESCUENTO_TRANSFERENCIA_DEFAULT
  }
}

// Lectura de la config del cintillo (la franja de arriba de todo). El tipo y
// la resolución del texto viven en src/lib/cintillo.ts, que es puro: el
// formulario del panel los necesita para previsualizar sin traerse Supabase.
const CLAVES_CINTILLO = ['descuento_transferencia_pct', 'cintillo_visible', 'cintillo_texto'] as const

export async function getCintilloConfig(): Promise<CintilloConfig> {
  const base: CintilloConfig = { visible: true, texto: '', descuentoPct: DESCUENTO_TRANSFERENCIA_DEFAULT }
  if (!configured()) return base
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('configuracion').select('clave, valor').in('clave', CLAVES_CINTILLO)
    if (error) throw error
    const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
    return {
      // Sin la clave guardada, visible: así se comportaba antes de que
      // existiera el interruptor.
      visible: map.get('cintillo_visible') !== 'false',
      texto: map.get('cintillo_texto')?.trim() ?? '',
      descuentoPct: parsePct(map.get('descuento_transferencia_pct')) ?? base.descuentoPct,
    }
  } catch {
    return base
  }
}

// Configuración de envíos (Fase 6k): umbral de envío gratis y punto de
// retiro. Mismo patrón KV con defaults seguros — sin umbral cargado no hay
// envío gratis, sin retiro activo no aparece la opción.
export type EnvioConfig = {
  // 0 = envío gratis desactivado.
  envioGratisUmbral: number
  retiroActivo: boolean
  retiroEtiqueta: string
}

const CLAVES_ENVIO = ['envio_gratis_umbral', 'retiro_activo', 'retiro_etiqueta'] as const
const RETIRO_ETIQUETA_DEFAULT = 'Retiro gratis por Martín Libros (Av. La Plata al 3576, Santos Lugares)'

export async function getEnvioConfig(): Promise<EnvioConfig> {
  const base: EnvioConfig = { envioGratisUmbral: 0, retiroActivo: false, retiroEtiqueta: RETIRO_ETIQUETA_DEFAULT }
  if (!configured()) return base
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('configuracion').select('clave, valor').in('clave', CLAVES_ENVIO)
    if (error) throw error
    const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
    const umbral = Number(map.get('envio_gratis_umbral'))
    return {
      envioGratisUmbral: Number.isFinite(umbral) && umbral > 0 ? Math.round(umbral) : 0,
      retiroActivo: map.get('retiro_activo') === 'true',
      retiroEtiqueta: map.get('retiro_etiqueta')?.trim() || base.retiroEtiqueta,
    }
  } catch {
    return base
  }
}

// Regla de envío gratis, pura para poder testearla: el costo pasa a 0 cuando
// el subtotal de productos (sin descuentos) alcanza el umbral. Umbral 0 o
// negativo = regla apagada.
export function aplicarEnvioGratis(subtotal: number, umbral: number, costo: number): number {
  return umbral > 0 && subtotal >= umbral ? 0 : costo
}

// Cupón de bienvenida por suscribirse al newsletter (Fase 8e): un único
// código general para todos (no uno por persona) — se manda por mail apenas
// alguien completa el popup, sin verificación de email.
//
// Desde la Fase 8i ya no vive en claves sueltas de `configuracion`: es una
// fila más de la tabla `cupones`, la que tiene es_bienvenida = true (la
// migración 0029 la creó a partir de las claves viejas). Se edita en
// /admin/cupones junto con todos los demás. Este helper sigue existiendo
// porque /api/newsletter necesita saber QUÉ código mandar por mail, y eso es
// una pregunta distinta de "¿este código que me tipearon vale?"
// (validarCupon en src/lib/cupon.ts).
export type CuponBienvenidaConfig = {
  activo: boolean
  codigo: string
  pct: number
}

const CUPON_BIENVENIDA_DEFAULT: CuponBienvenidaConfig = { activo: false, codigo: 'BIENVENIDA10', pct: 10 }

export async function getCuponBienvenida(): Promise<CuponBienvenidaConfig> {
  if (!configured()) return CUPON_BIENVENIDA_DEFAULT
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('cupones')
      .select('codigo, pct, activo')
      .eq('es_bienvenida', true)
      .maybeSingle()
    if (error) throw error
    // Sin fila de bienvenida (Dani la borró desde /admin/cupones) el popup
    // no tiene nada que mandar: apagado, no un código inventado que rebote.
    if (!data) return { ...CUPON_BIENVENIDA_DEFAULT, activo: false }
    return { activo: data.activo, codigo: data.codigo.trim().toUpperCase(), pct: data.pct }
  } catch {
    return CUPON_BIENVENIDA_DEFAULT
  }
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
