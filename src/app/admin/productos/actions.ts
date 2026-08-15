'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { esSlugValido, generarSlug } from '@/lib/slugs'
import type { Categoria, Producto, ProductoInsert, ProductoUpdate } from '@/types/db'

type Ok = { ok: true }
type OkId = { ok: true; id: string }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

// Un producto editado aparece en la home, el catálogo, su ficha, los
// "relacionados" de otras fichas y los bloques de cualquier página —
// revalidar todo el sitio es lo único siempre correcto a esta escala.
function revalidarPublico() {
  revalidatePath('/', 'layout')
}

export async function actualizarProducto(id: string, patch: ProductoUpdate): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  if (patch.nombre !== undefined && patch.nombre.trim() === '') {
    return { ok: false, error: 'El nombre no puede quedar vacío.' }
  }
  if (patch.slug !== undefined && !esSlugValido(patch.slug)) {
    return { ok: false, error: 'El slug solo puede tener minúsculas, números y guiones.' }
  }

  const { error } = await supabase.from('productos').update(patch).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Ya existe otro producto con ese slug.' }
    return { ok: false, error: 'No se pudo guardar el cambio.' }
  }

  revalidarPublico()
  return { ok: true }
}

export async function crearProducto(input: ProductoInsert): Promise<OkId | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (!input.nombre.trim()) return { ok: false, error: 'El nombre es obligatorio.' }
  if (!esSlugValido(input.slug)) {
    return { ok: false, error: 'El slug solo puede tener minúsculas, números y guiones.' }
  }

  const { data, error } = await supabase.from('productos').insert(input).select('id').single()
  if (error || !data) {
    if (error?.code === '23505') return { ok: false, error: 'Ya existe otro producto con ese slug.' }
    return { ok: false, error: 'No se pudo crear el producto.' }
  }

  revalidarPublico()
  return { ok: true, id: data.id }
}

export async function borrarProducto(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) return { ok: false, error: 'No se pudo borrar el producto.' }

  revalidarPublico()
  return { ok: true }
}

// Productos elegibles como "ingrediente" de otro (Qué incluye) — se excluye
// el propio producto que se está editando para que un kit no pueda
// contenerse a sí mismo.
export async function getProductosParaContenido(excludeId?: string): Promise<Producto[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  let query = supabase.from('productos').select('*').order('nombre', { ascending: true })
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// --- Variantes (Fase 8g) -----------------------------------------------------
// Candidatas para agrupar como variantes entre sí: solo cajas/kits (mismo
// alcance que la constraint de la migración 0028).
export async function getProductosParaVariantes(excludeId?: string): Promise<Producto[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  let query = supabase
    .from('productos')
    .select('*')
    .in('tipo', ['caja', 'kit'])
    .order('nombre', { ascending: true })
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// Reemplaza el grupo de variantes de un producto por el conjunto elegido.
// `variante_grupo_id` es un tag compartido sin tabla propia (ver migración
// 0028): si el producto no tenía grupo, se crea uno nuevo acá mismo; si ya
// tenía, se reusa para no romper el vínculo con quienes no se tocaron. Los
// que salen del grupo quedan sueltos (variante_grupo_id = null); si el grupo
// queda con un solo integrante después de sacar gente, también se suelta —
// un grupo de 1 no tiene sentido (no hay "otra variante" que mostrar).
export async function guardarVariantesProducto(productoId: string, miembroIds: string[]): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: actual, error: actualErr } = await supabase
    .from('productos')
    .select('id, tipo, variante_grupo_id')
    .eq('id', productoId)
    .single()
  if (actualErr || !actual) return { ok: false, error: 'No se encontró el producto.' }
  if (actual.tipo !== 'caja' && actual.tipo !== 'kit') {
    return { ok: false, error: 'Las variantes solo están disponibles para cajas y kits.' }
  }

  const idsUnicos = [...new Set(miembroIds)].filter((id) => id !== productoId)

  if (idsUnicos.length === 0) {
    if (actual.variante_grupo_id) {
      const { error } = await supabase
        .from('productos')
        .update({ variante_grupo_id: null })
        .eq('id', productoId)
      if (error) return { ok: false, error: 'No se pudo actualizar la variante.' }
      await soltarGrupoSiQuedaSolo(supabase, actual.variante_grupo_id)
    }
    revalidarPublico()
    return { ok: true }
  }

  const grupoId = actual.variante_grupo_id ?? crypto.randomUUID()

  if (actual.variante_grupo_id) {
    const { data: anteriores } = await supabase
      .from('productos')
      .select('id')
      .eq('variante_grupo_id', actual.variante_grupo_id)
    const salen = (anteriores ?? [])
      .map((p) => p.id)
      .filter((id) => id !== productoId && !idsUnicos.includes(id))
    if (salen.length > 0) {
      const { error } = await supabase.from('productos').update({ variante_grupo_id: null }).in('id', salen)
      if (error) return { ok: false, error: 'No se pudo actualizar la variante.' }
    }
  }

  const { error: propioErr } = await supabase
    .from('productos')
    .update({ variante_grupo_id: grupoId })
    .eq('id', productoId)
  if (propioErr) return { ok: false, error: 'No se pudo actualizar la variante.' }

  const { error: miembrosErr } = await supabase
    .from('productos')
    .update({ variante_grupo_id: grupoId })
    .in('id', idsUnicos)
  if (miembrosErr) return { ok: false, error: 'No se pudo actualizar la variante.' }

  revalidarPublico()
  return { ok: true }
}

async function soltarGrupoSiQuedaSolo(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteAutenticado>>>,
  grupoId: string,
) {
  const { data } = await supabase.from('productos').select('id').eq('variante_grupo_id', grupoId)
  if ((data ?? []).length === 1) {
    await supabase
      .from('productos')
      .update({ variante_grupo_id: null })
      .eq('variante_grupo_id', grupoId)
  }
}

// --- Categorías (Fase 6i) ----------------------------------------------------

export async function getCategoriasAdmin(): Promise<Categoria[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })
  if (error) return []
  return data ?? []
}

// Cuántos productos y cuántos bloques de página dependen de cada categoría —
// solo lo necesita el manager de categorías, para poder avisar qué se
// rompería ANTES de borrar (ver borrarCategoria). El catálogo es de un
// puñado de productos y de páginas, así que se cuenta en memoria en vez de
// pelear con los embeds de conteo de PostgREST.
export type CategoriaConUso = Categoria & { productos: number; bloques: number }

export async function getCategoriasAdminConUso(): Promise<CategoriaConUso[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []

  const [categorias, vinculos, secciones] = await Promise.all([
    supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase.from('producto_categorias').select('categoria_id'),
    supabase.from('pagina_secciones').select('tipo, config'),
  ])

  const porCategoria = new Map<string, number>()
  for (const v of vinculos.data ?? []) {
    porCategoria.set(v.categoria_id, (porCategoria.get(v.categoria_id) ?? 0) + 1)
  }

  const porSlug = new Map<string, number>()
  for (const slug of slugsUsadosPorBloques(secciones.data ?? [])) {
    porSlug.set(slug, (porSlug.get(slug) ?? 0) + 1)
  }

  return (categorias.data ?? []).map((c) => ({
    ...c,
    productos: porCategoria.get(c.id) ?? 0,
    bloques: porSlug.get(c.slug) ?? 0,
  }))
}

// Los bloques guardan la categoría por slug, en dos formas distintas: los
// carruseles de productos en config.categoria (cuando fuente = 'categoria',
// ver migración 0024) y las cards de categoría en config.categorias[].
// categoriaSlug. Devuelve un slug por referencia encontrada — repetidos
// incluidos, así el conteo dice "3 bloques" y no "3 categorías distintas".
function slugsUsadosPorBloques(filas: { tipo: string; config: unknown }[]): string[] {
  const slugs: string[] = []
  for (const fila of filas) {
    const config = (fila.config ?? {}) as Record<string, unknown>
    if (fila.tipo === 'productos' || fila.tipo === 'mas_vendidos') {
      if (config.fuente === 'categoria' && typeof config.categoria === 'string' && config.categoria) {
        slugs.push(config.categoria)
      }
    }
    if (fila.tipo === 'categorias' && Array.isArray(config.categorias)) {
      for (const card of config.categorias as { categoriaSlug?: unknown }[]) {
        if (typeof card?.categoriaSlug === 'string' && card.categoriaSlug) slugs.push(card.categoriaSlug)
      }
    }
  }
  return slugs
}

export async function crearCategoria(nombre: string): Promise<{ ok: true; categoria: Categoria } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  const limpio = nombre.trim()
  if (!limpio) return { ok: false, error: 'Escribí un nombre para la categoría.' }
  const slug = generarSlug(limpio)
  if (!slug) return { ok: false, error: 'Ese nombre no genera una URL válida.' }

  // Las nuevas van al final: después de las 4 fijas y de las ya creadas.
  const { data: max } = await supabase.from('categorias').select('orden').order('orden', { ascending: false }).limit(1)
  const orden = ((max ?? [])[0]?.orden ?? -1) + 1

  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre: limpio, slug, orden })
    .select('*')
    .single()
  if (error || !data) {
    if (error?.code === '23505') return { ok: false, error: 'Ya existe una categoría con ese nombre.' }
    return { ok: false, error: 'No se pudo crear la categoría.' }
  }
  return { ok: true, categoria: data }
}

// Solo el nombre visible cambia — el slug queda fijo de por vida: ya lo usan
// los anchors del catálogo (/productos#slug) y los links guardados en cards
// de categoría de otras páginas (ej. la home). Regenerarlo rompería esos
// links existentes sin que nada avise.
export async function renombrarCategoria(id: string, nombre: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  const limpio = nombre.trim()
  if (!limpio) return { ok: false, error: 'El nombre no puede quedar vacío.' }

  const { error } = await supabase.from('categorias').update({ nombre: limpio }).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Ya existe una categoría con ese nombre.' }
    return { ok: false, error: 'No se pudo renombrar la categoría.' }
  }

  revalidarPublico()
  return { ok: true }
}

// "Destacados" no es una temática más: de ella dependen el toggle de la
// lista de productos (toggleDestacado la busca por este slug) y la vidriera
// de la home. Borrarla dejaría ambas cosas rotas sin ningún aviso, así que
// es la única que no se puede borrar.
const CATEGORIA_PROTEGIDA = 'destacados'

// Borrar una categoría NO borra sus productos: producto_categorias tiene
// "on delete cascade" (migración 0020), así que solo se cortan los vínculos
// y los productos quedan sin esa etiqueta. Los bloques de página que
// apuntaban a ella sí quedan mudos (0 resultados = la sección desaparece en
// silencio, el mismo fallo que documenta la migración 0024) — por eso el
// manager avisa cuántos son antes de confirmar.
export async function borrarCategoria(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: categoria, error: buscarErr } = await supabase
    .from('categorias')
    .select('slug')
    .eq('id', id)
    .maybeSingle()
  if (buscarErr) return { ok: false, error: 'No se pudo borrar la categoría.' }
  if (!categoria) return { ok: false, error: 'Esa categoría ya no existe.' }
  if (categoria.slug === CATEGORIA_PROTEGIDA) {
    return {
      ok: false,
      error: '"Destacados" no se puede borrar: de ella dependen el toggle de destacados y la vidriera de la home.',
    }
  }

  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) return { ok: false, error: 'No se pudo borrar la categoría.' }

  revalidarPublico()
  return { ok: true }
}

// Reemplaza el orden de todas las categorías de una — se manda la lista
// completa ya en el orden final (mismo patrón que nav_links).
export async function reordenarCategorias(ids: string[]): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const resultados = await Promise.all(
    ids.map((id, orden) => supabase.from('categorias').update({ orden }).eq('id', id)),
  )
  if (resultados.some((r) => r.error)) return { ok: false, error: 'No se pudo guardar el orden.' }

  revalidarPublico()
  return { ok: true }
}

// Reemplaza el set completo de categorías de un producto (mismo patrón
// delete+insert que guardarContenidoProducto — son listas de un puñado).
export async function guardarCategoriasProducto(
  productoId: string,
  categoriaIds: string[],
): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error: delErr } = await supabase.from('producto_categorias').delete().eq('producto_id', productoId)
  if (delErr) return { ok: false, error: 'No se pudieron actualizar las categorías.' }

  if (categoriaIds.length > 0) {
    const filas = categoriaIds.map((categoria_id) => ({ producto_id: productoId, categoria_id }))
    const { error: insErr } = await supabase.from('producto_categorias').insert(filas)
    if (insErr) return { ok: false, error: 'No se pudieron guardar las categorías.' }
  }

  revalidarPublico()
  return { ok: true }
}

// El toggle "Destacado" de la lista: destacar = pertenecer a la categoría
// "Destacados" (desde la Fase 6i ya no es un boolean aparte).
export async function toggleDestacado(
  productoId: string,
  destacado: boolean,
): Promise<{ ok: true; categoria: Categoria } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: cat } = await supabase.from('categorias').select('*').eq('slug', 'destacados').maybeSingle()
  if (!cat) return { ok: false, error: 'No existe la categoría "Destacados".' }

  if (destacado) {
    const { error } = await supabase
      .from('producto_categorias')
      .upsert({ producto_id: productoId, categoria_id: cat.id })
    if (error) return { ok: false, error: 'No se pudo destacar el producto.' }
  } else {
    const { error } = await supabase
      .from('producto_categorias')
      .delete()
      .eq('producto_id', productoId)
      .eq('categoria_id', cat.id)
    if (error) return { ok: false, error: 'No se pudo quitar el destacado.' }
  }

  revalidarPublico()
  return { ok: true, categoria: cat }
}

export type ContenidoInput = { item_id: string; cantidad: number }[]

// Reemplaza atómicamente el contenido ("qué incluye") de un producto: borra
// las filas existentes y carga las nuevas. Es una lista corta por producto
// (unos pocos ítems), así que no hace falta diffing fila por fila.
export async function guardarContenidoProducto(
  productoId: string,
  items: ContenidoInput,
): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error: delErr } = await supabase.from('producto_items').delete().eq('producto_id', productoId)
  if (delErr) return { ok: false, error: 'No se pudo actualizar el contenido.' }

  if (items.length > 0) {
    const filas = items.map((it, idx) => ({
      producto_id: productoId,
      item_id: it.item_id,
      cantidad: it.cantidad,
      orden: idx,
    }))
    const { error: insErr } = await supabase.from('producto_items').insert(filas)
    if (insErr) return { ok: false, error: 'No se pudo guardar el contenido.' }
  }

  revalidarPublico()
  return { ok: true }
}
