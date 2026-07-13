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
