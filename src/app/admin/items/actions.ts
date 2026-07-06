'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ItemCatalogo, ItemTipo } from '@/types/db'

type Ok = { ok: true }
type OkItem = { ok: true; item: ItemCatalogo }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidarPublico() {
  revalidatePath('/admin/items')
  revalidatePath('/admin/productos')
  revalidatePath('/')
  revalidatePath('/productos')
}

export type ItemInput = {
  tipo: ItemTipo
  nombre: string
  autor?: string | null
  descripcion?: string | null
  precio?: number | null
  stock?: number | null
  activo?: boolean
  imagen?: string | null
  imagenes_galeria?: string[]
}

export async function crearItem(input: ItemInput): Promise<OkItem | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (!input.nombre.trim()) return { ok: false, error: 'El nombre es obligatorio.' }

  const { data, error } = await supabase
    .from('items_catalogo')
    .insert({
      tipo: input.tipo,
      nombre: input.nombre.trim(),
      autor: input.autor?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
    })
    .select('*')
    .single()
  if (error || !data) {
    if (error?.code === '23505') return { ok: false, error: 'Ya existe un ítem con ese nombre.' }
    return { ok: false, error: 'No se pudo crear el ítem.' }
  }

  revalidarPublico()
  return { ok: true, item: data }
}

export async function actualizarItem(id: string, patch: Partial<ItemInput>): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (patch.nombre !== undefined && !patch.nombre.trim()) {
    return { ok: false, error: 'El nombre no puede quedar vacío.' }
  }

  const { error } = await supabase.from('items_catalogo').update(patch).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Ya existe un ítem con ese nombre.' }
    if (error.code === '23514') return { ok: false, error: 'El precio y el stock no pueden ser negativos.' }
    return { ok: false, error: 'No se pudo guardar el cambio.' }
  }

  revalidarPublico()
  return { ok: true }
}

export async function borrarItem(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('items_catalogo').delete().eq('id', id)
  if (error) {
    // Foreign key restrict: sigue usado por algún producto activo.
    if (error.code === '23503') {
      return {
        ok: false,
        error: 'Este ítem todavía está dentro de una caja/kit — sacalo de ahí primero.',
      }
    }
    return { ok: false, error: 'No se pudo borrar el ítem.' }
  }

  revalidarPublico()
  return { ok: true }
}

// --- Gestión de pertenencia a kits/cajas desde la ficha del ítem ------------

export type ProductoQueUsaItem = {
  producto_id: string
  producto_nombre: string
  producto_slug: string
  cantidad: number
}

export async function getProductosQueUsanItem(itemId: string): Promise<ProductoQueUsaItem[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('producto_items')
    .select('cantidad, productos(id, nombre, slug)')
    .eq('item_id', itemId)
  if (error || !data) return []
  return data
    .filter((fila): fila is typeof fila & { productos: NonNullable<(typeof fila)['productos']> } => !!fila.productos)
    .map((fila) => ({
      producto_id: fila.productos.id,
      producto_nombre: fila.productos.nombre,
      producto_slug: fila.productos.slug,
      cantidad: fila.cantidad,
    }))
}

export type ProductoOpcion = { id: string; nombre: string }

export async function getProductosParaSelector(): Promise<ProductoOpcion[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase.from('productos').select('id, nombre').order('nombre', { ascending: true })
  if (error) return []
  return data ?? []
}

// Agrega este ítem a un producto puntual sin tocar el resto de su contenido
// (contraparte de guardarContenidoProducto(), que reemplaza todo de una vez —
// acá se gestiona desde la ficha del ítem, así que solo tocamos una fila).
export async function agregarItemAProducto(
  productoId: string,
  itemId: string,
  cantidad: number,
): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase
    .from('producto_items')
    .insert({ producto_id: productoId, item_id: itemId, cantidad: Math.max(1, cantidad) })
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Ese ítem ya está en ese producto.' }
    return { ok: false, error: 'No se pudo agregar el ítem al producto.' }
  }

  revalidarPublico()
  return { ok: true }
}

export async function quitarItemDeProducto(productoId: string, itemId: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase
    .from('producto_items')
    .delete()
    .eq('producto_id', productoId)
    .eq('item_id', itemId)
  if (error) return { ok: false, error: 'No se pudo quitar el ítem del producto.' }

  revalidarPublico()
  return { ok: true }
}
