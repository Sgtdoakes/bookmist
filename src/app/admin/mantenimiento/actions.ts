'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { activarMantenimientoManual, desactivarMantenimiento, type Entorno } from '@/lib/mantenimiento'

type Ok = { ok: true }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

export async function activarManual(entorno: Entorno, mensaje: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  await activarMantenimientoManual(supabase, entorno, mensaje)
  revalidatePath('/admin/mantenimiento')
  revalidatePath('/mantenimiento')
  return { ok: true }
}

export async function desactivarManual(entorno: Entorno): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  await desactivarMantenimiento(supabase, entorno)
  revalidatePath('/admin/mantenimiento')
  revalidatePath('/mantenimiento')
  return { ok: true }
}
