'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getDestacados } from '@/lib/productos'
import { resolverProductosBloque } from '@/components/public/productos-bloque'
import { generarSlug, esSlugValido } from '@/lib/slugs'
import { SLUGS_RESERVADOS } from '@/lib/paginas'
import {
  filasAAdmin,
  resolverSeccion,
  TIPOS_CONOCIDOS,
  type SeccionAdmin,
  type SeccionPreview,
  type SeccionTipo,
} from '@/lib/secciones'
import type { PaginaRow } from '@/types/db'

type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidarPublico() {
  revalidatePath('/')
  revalidatePath('/productos')
  revalidatePath('/admin/pagina')
}

function esSeccionTipoConocido(tipo: string): tipo is SeccionTipo {
  return (TIPOS_CONOCIDOS as string[]).includes(tipo)
}

export async function getSeccionesAdmin(pagina = 'home'): Promise<SeccionAdmin[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('pagina_secciones')
    .select('*')
    .eq('pagina', pagina)
    .order('orden', { ascending: true })
  if (error) return []
  return filasAAdmin(data ?? [])
}

// Resuelve un lote de bloques (borrador, todavía no guardado) a datos
// pintables — para 'productos'/'mas_vendidos' trae los productos reales
// según la fuente configurada; el resto de los tipos son puros y se
// devuelven tal cual. Lo llama el lienzo del admin al agregar un bloque o
// al cambiar algo que afecta QUÉ se muestra (fuente/categoría/selección
// manual), con debounce del lado del cliente.
export async function previewSecciones(
  items: { id: string; tipo: string; config: Record<string, unknown> }[],
): Promise<SeccionPreview[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []

  const resultados: SeccionPreview[] = []
  for (const item of items) {
    if (!esSeccionTipoConocido(item.tipo)) continue
    // resolverSeccion() pone id=tipo (pensado solo como key para .map() en
    // el sitio público) — acá hace falta el id REAL de la fila para poder
    // indexar el preview por id en el lienzo del admin.
    const resuelta = { ...resolverSeccion(item.tipo, item.config), id: item.id }
    if (resuelta.tipo === 'productos') {
      const productosResueltos = await resolverProductosBloque(resuelta.config)
      resultados.push({ ...resuelta, productosResueltos })
    } else if (resuelta.tipo === 'mas_vendidos') {
      const productosResueltos = await getDestacados(12)
      resultados.push({ ...resuelta, productosResueltos })
    } else {
      resultados.push(resuelta)
    }
  }
  return resultados
}

export type LayoutItem = {
  id: string // uuid real (existe en la base) o temporal generado al agregar/duplicar (se inserta al guardar)
  tipo: SeccionTipo
  activo: boolean
  config: Record<string, unknown>
}

// Persiste el borrador completo del lienzo de una sola vez: borra lo que se
// sacó, actualiza lo que sigue e inserta lo nuevo, con orden = índice.
// Devuelve las filas frescas (con ids reales) para resetear el editor.
export async function guardarLayout(
  pagina: string,
  items: LayoutItem[],
): Promise<{ ok: true; secciones: SeccionAdmin[] } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (items.some((it) => !esSeccionTipoConocido(it.tipo))) {
    return { ok: false, error: 'Tipo de bloque inválido.' }
  }

  const { data: existentes, error: errLeer } = await supabase
    .from('pagina_secciones')
    .select('id')
    .eq('pagina', pagina)
  if (errLeer) return { ok: false, error: 'No se pudo leer el estado actual.' }

  const existIds = new Set((existentes ?? []).map((r) => r.id))
  const draftIds = new Set(items.map((i) => i.id))

  const aBorrar = [...existIds].filter((id) => !draftIds.has(id))
  if (aBorrar.length > 0) {
    const { error } = await supabase.from('pagina_secciones').delete().in('id', aBorrar)
    if (error) return { ok: false, error: 'No se pudieron eliminar bloques.' }
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (existIds.has(it.id)) {
      const { error } = await supabase
        .from('pagina_secciones')
        .update({ tipo: it.tipo, activo: it.activo, config: it.config, orden: i })
        .eq('id', it.id)
      if (error) return { ok: false, error: 'No se pudo guardar un bloque.' }
    } else {
      const { error } = await supabase
        .from('pagina_secciones')
        .insert({ id: it.id, pagina, tipo: it.tipo, activo: it.activo, config: it.config, orden: i })
      if (error) return { ok: false, error: 'No se pudo crear un bloque.' }
    }
  }

  revalidarPublico()
  const { data: frescas } = await supabase
    .from('pagina_secciones')
    .select('*')
    .eq('pagina', pagina)
    .order('orden', { ascending: true })
  return { ok: true, secciones: filasAAdmin(frescas ?? []) }
}

export async function getPaginasAdmin(): Promise<PaginaRow[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase.from('paginas').select('*').order('orden', { ascending: true })
  if (error) return []
  return data ?? []
}

// Crea una página institucional nueva (sistema=false): genera el slug desde
// el título, lo valida contra el formato y contra segmentos de ruta que ya
// existen fijos en el código (ver SLUGS_RESERVADOS) para no crear una
// página fantasma inalcanzable en su propia URL.
export async function crearPagina(titulo: string): Promise<{ ok: true; pagina: PaginaRow } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  const tituloLimpio = titulo.trim()
  if (!tituloLimpio) return { ok: false, error: 'Ingresá un título.' }

  const slug = generarSlug(tituloLimpio)
  if (!slug || !esSlugValido(slug)) return { ok: false, error: 'Ese título no genera una URL válida.' }
  if ((SLUGS_RESERVADOS as string[]).includes(slug)) {
    return { ok: false, error: `"${slug}" ya es una sección fija del sitio — elegí otro título.` }
  }

  const { data: existente } = await supabase.from('paginas').select('id').eq('slug', slug).maybeSingle()
  if (existente) return { ok: false, error: 'Ya existe una página con esa URL.' }

  const { data: max } = await supabase.from('paginas').select('orden').order('orden', { ascending: false }).limit(1)
  const orden = ((max ?? [])[0]?.orden ?? -1) + 1

  const { data, error } = await supabase
    .from('paginas')
    .insert({ slug, titulo: tituloLimpio, sistema: false, orden })
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: 'No se pudo crear la página.' }

  revalidarPublico()
  return { ok: true, pagina: data }
}

// Borra una página institucional (nunca una de sistema) — sus bloques se
// van con ella por el "on delete cascade" de la FK en pagina_secciones.
export async function eliminarPagina(id: string): Promise<{ ok: true } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: pagina } = await supabase.from('paginas').select('sistema').eq('id', id).maybeSingle()
  if (!pagina) return { ok: false, error: 'La página ya no existe.' }
  if (pagina.sistema) return { ok: false, error: 'Esta página es fija del sitio, no se puede borrar.' }

  const { error } = await supabase.from('paginas').delete().eq('id', id)
  if (error) return { ok: false, error: 'No se pudo borrar la página.' }

  revalidarPublico()
  return { ok: true }
}
