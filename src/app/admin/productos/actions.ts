'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { esSlugValido } from '@/lib/slugs'
import type { ProductoInsert, ProductoUpdate, ItemCatalogo } from '@/types/db'

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

function revalidarPublico(slug?: string) {
  revalidatePath('/')
  revalidatePath('/productos')
  if (slug) revalidatePath(`/productos/${slug}`)
  revalidatePath('/admin/productos')
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

  revalidarPublico(patch.slug)
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

  revalidarPublico(input.slug)
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

export async function getItemsCatalogoAdmin(): Promise<ItemCatalogo[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase.from('items_catalogo').select('*').order('nombre', { ascending: true })
  if (error) return []
  return data ?? []
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
