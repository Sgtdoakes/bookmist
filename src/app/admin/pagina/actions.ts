'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { filasAAdmin, type SeccionAdmin } from '@/lib/secciones'

type Ok = { ok: true }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidarHome() {
  revalidatePath('/')
  revalidatePath('/admin/pagina')
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

// Persiste el nuevo orden de arrastre: `ids` viene en el orden final deseado.
export async function guardarOrden(ids: string[]): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const resultados = await Promise.all(
    ids.map((id, index) => supabase.from('pagina_secciones').update({ orden: index }).eq('id', id)),
  )
  const fallo = resultados.find((r) => r.error)
  if (fallo) return { ok: false, error: 'No se pudo guardar el nuevo orden.' }

  revalidarHome()
  return { ok: true }
}

export async function toggleActivoSeccion(id: string, activo: boolean): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('pagina_secciones').update({ activo }).eq('id', id)
  if (error) return { ok: false, error: 'No se pudo cambiar la visibilidad.' }

  revalidarHome()
  return { ok: true }
}

export async function guardarConfigSeccion(
  id: string,
  config: Record<string, unknown>,
): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('pagina_secciones').update({ config }).eq('id', id)
  if (error) return { ok: false, error: 'No se pudo guardar el contenido.' }

  revalidarHome()
  return { ok: true }
}
