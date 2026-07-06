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

export type ItemInput = {
  tipo: ItemTipo
  nombre: string
  autor?: string | null
  descripcion?: string | null
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

  revalidatePath('/admin/items')
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
    return { ok: false, error: 'No se pudo guardar el cambio.' }
  }

  revalidatePath('/admin/items')
  revalidatePath('/')
  revalidatePath('/productos')
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

  revalidatePath('/admin/items')
  return { ok: true }
}
