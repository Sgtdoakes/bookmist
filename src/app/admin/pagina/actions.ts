'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { filasAAdmin, type SeccionAdmin, type SeccionTipo } from '@/lib/secciones'

type OkId = { ok: true; id: string }

type Ok = { ok: true }
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

  revalidarPublico()
  return { ok: true }
}

export async function toggleActivoSeccion(id: string, activo: boolean): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('pagina_secciones').update({ activo }).eq('id', id)
  if (error) return { ok: false, error: 'No se pudo cambiar la visibilidad.' }

  revalidarPublico()
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

  revalidarPublico()
  return { ok: true }
}

// Agrega un bloque libre nuevo (texto/productos/banner) al final de la
// página — arranca oculto para que Dani lo pueda cargar con calma antes de
// mostrarlo.
export async function crearSeccion(pagina: string, tipo: SeccionTipo): Promise<OkId | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: existentes } = await supabase
    .from('pagina_secciones')
    .select('orden')
    .eq('pagina', pagina)
    .order('orden', { ascending: false })
    .limit(1)
  const siguienteOrden = (existentes?.[0]?.orden ?? -1) + 1

  const { data, error } = await supabase
    .from('pagina_secciones')
    .insert({ pagina, tipo, orden: siguienteOrden, activo: false, config: {} })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: 'No se pudo agregar el bloque.' }

  revalidarPublico()
  return { ok: true, id: data.id }
}

export async function duplicarSeccion(id: string): Promise<OkId | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: original, error: errLectura } = await supabase
    .from('pagina_secciones')
    .select('pagina, tipo, orden, activo, config')
    .eq('id', id)
    .single()
  if (errLectura || !original) return { ok: false, error: 'No se pudo duplicar el bloque.' }

  const { data, error } = await supabase
    .from('pagina_secciones')
    .insert({ ...original, orden: original.orden + 1 })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: 'No se pudo duplicar el bloque.' }

  revalidarPublico()
  return { ok: true, id: data.id }
}

export async function eliminarSeccion(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('pagina_secciones').delete().eq('id', id)
  if (error) return { ok: false, error: 'No se pudo eliminar el bloque.' }

  revalidarPublico()
  return { ok: true }
}
