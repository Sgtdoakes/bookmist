'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ZonaEnvio } from '@/types/db'

type Ok = { ok: true }
type OkZona = { ok: true; zona: ZonaEnvio }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidar() {
  revalidatePath('/checkout')
  revalidatePath('/admin/zonas')
}

export async function crearZona(nombre: string, costo: number): Promise<OkZona | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (!nombre.trim()) return { ok: false, error: 'El nombre es obligatorio.' }
  if (!Number.isFinite(costo) || costo < 0) return { ok: false, error: 'Ingresá un costo válido.' }

  const { data, error } = await supabase
    .from('zonas_envio')
    .insert({ nombre: nombre.trim(), costo })
    .select('*')
    .single()
  if (error || !data) {
    if (error?.code === '23505') return { ok: false, error: 'Ya existe una zona con ese nombre.' }
    return { ok: false, error: 'No se pudo crear la zona.' }
  }

  revalidar()
  return { ok: true, zona: data }
}

export async function actualizarZona(
  id: string,
  patch: { nombre?: string; costo?: number; activo?: boolean },
): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (patch.nombre !== undefined && !patch.nombre.trim()) {
    return { ok: false, error: 'El nombre no puede quedar vacío.' }
  }
  if (patch.costo !== undefined && (!Number.isFinite(patch.costo) || patch.costo < 0)) {
    return { ok: false, error: 'Ingresá un costo válido.' }
  }

  const { error } = await supabase.from('zonas_envio').update(patch).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Ya existe una zona con ese nombre.' }
    return { ok: false, error: 'No se pudo guardar el cambio.' }
  }

  revalidar()
  return { ok: true }
}

export async function borrarZona(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('zonas_envio').delete().eq('id', id)
  if (error) return { ok: false, error: 'No se pudo borrar la zona.' }

  revalidar()
  return { ok: true }
}
