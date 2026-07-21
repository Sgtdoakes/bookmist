'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  guardarValoresConfiguracion,
  type MarcaConfig,
  type CuentaPago,
  type CuponBienvenidaConfig,
} from '@/lib/configuracion'

type Ok = { ok: true }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

// La marca (header/footer/colores/nav) se ve en TODAS las páginas — un
// revalidate por ruta puntual deja el resto del sitio mostrando lo viejo
// hasta que venza su ISR (bug real reportado por Dani). 'layout' sobre la
// raíz invalida el cache de todas las rutas de una.
function revalidarPublico() {
  revalidatePath('/', 'layout')
}

export async function guardarMarcaConfig(marca: MarcaConfig): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  try {
    await guardarValoresConfiguracion(supabase, {
      marca_nombre: marca.nombre,
      marca_logo_url: marca.logoUrl ?? '',
      marca_favicon_url: marca.faviconUrl ?? '',
      marca_tagline_header: marca.taglineHeader,
      marca_tagline_footer: marca.taglineFooter,
      marca_copyright: marca.copyright,
      marca_email: marca.email,
      marca_whatsapp: marca.whatsapp,
      marca_instagram_url: marca.instagram,
      marca_instagram_handle: marca.instagramHandle,
      marca_tiktok_url: marca.tiktok,
      marca_color_primario: marca.colorPrimario ?? '',
      marca_color_secundario: marca.colorSecundario ?? '',
      marca_color_acento: marca.colorAcento ?? '',
      marca_metodos_pago: JSON.stringify(marca.metodosPago),
      marca_metodos_envio: JSON.stringify(marca.metodosEnvio),
    })
  } catch {
    return { ok: false, error: 'No se pudo guardar la configuración.' }
  }

  revalidarPublico()
  return { ok: true }
}

export async function guardarCuentasPago(cuentas: CuentaPago[]): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  try {
    await guardarValoresConfiguracion(supabase, { pago_cuentas: JSON.stringify(cuentas) })
  } catch {
    return { ok: false, error: 'No se pudieron guardar los datos de pago.' }
  }

  revalidarPublico()
  revalidatePath('/checkout')
  return { ok: true }
}

export async function guardarCuponBienvenida(cfg: CuponBienvenidaConfig): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const codigo = cfg.codigo.trim().toUpperCase()
  if (cfg.activo && !codigo) return { ok: false, error: 'Escribí un código para el cupón.' }
  if (!Number.isFinite(cfg.pct) || cfg.pct <= 0 || cfg.pct > 100) {
    return { ok: false, error: 'Ingresá un porcentaje entre 1 y 100.' }
  }

  try {
    await guardarValoresConfiguracion(supabase, {
      cupon_bienvenida_activo: cfg.activo ? 'true' : 'false',
      cupon_bienvenida_codigo: codigo,
      cupon_bienvenida_pct: String(cfg.pct),
    })
  } catch {
    return { ok: false, error: 'No se pudo guardar el cupón.' }
  }

  revalidarPublico()
  return { ok: true }
}

export type NavLinkItem = { id: string; label: string; href: string; activo: boolean }

// Reemplazo completo del lienzo de nav_links en una sola pasada — mismo
// patrón diff (borrar/actualizar/insertar) que guardarLayout en
// src/app/admin/pagina/actions.ts.
export async function guardarNavLinks(items: NavLinkItem[]): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (items.some((it) => !it.label.trim() || !it.href.trim())) {
    return { ok: false, error: 'Cada link necesita texto y destino.' }
  }

  const { data: existentes, error: errLeer } = await supabase.from('nav_links').select('id')
  if (errLeer) return { ok: false, error: 'No se pudo leer el estado actual.' }

  const existIds = new Set((existentes ?? []).map((r) => r.id))
  const draftIds = new Set(items.map((i) => i.id))

  const aBorrar = [...existIds].filter((id) => !draftIds.has(id))
  if (aBorrar.length > 0) {
    const { error } = await supabase.from('nav_links').delete().in('id', aBorrar)
    if (error) return { ok: false, error: 'No se pudieron eliminar links.' }
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const fila = { label: it.label.trim(), href: it.href.trim(), activo: it.activo, orden: i }
    if (existIds.has(it.id)) {
      const { error } = await supabase.from('nav_links').update(fila).eq('id', it.id)
      if (error) return { ok: false, error: 'No se pudo guardar un link.' }
    } else {
      const { error } = await supabase.from('nav_links').insert({ id: it.id, ...fila })
      if (error) return { ok: false, error: 'No se pudo crear un link.' }
    }
  }

  revalidarPublico()
  return { ok: true }
}
