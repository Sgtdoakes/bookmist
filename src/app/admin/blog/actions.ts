'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { esSlugValido } from '@/lib/slugs'

type Ok = { ok: true }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_PRODUCTOS = 24

export type NotaInput = {
  id: string
  slug: string
  titulo: string
  bajada: string
  imagen: string | null
  cuerpo: string
  productoIds: string[]
  publicado: boolean
}

function validar(n: NotaInput): string | null {
  if (!UUID.test(n.id)) return 'Nota inválida.'
  if (!n.titulo.trim()) return 'El título es obligatorio.'
  if (n.titulo.length > 200) return 'El título no puede pasar de 200 caracteres.'
  if (!esSlugValido(n.slug)) return 'La dirección solo puede tener minúsculas, números y guiones.'
  if (n.bajada.length > 500) return 'La bajada no puede pasar de 500 caracteres.'
  if (n.cuerpo.length > 60000) return 'El texto es demasiado largo.'
  if (n.imagen && !/^https:\/\//.test(n.imagen)) return 'La imagen no es válida.'
  if (n.productoIds.length > MAX_PRODUCTOS) return `Podés elegir hasta ${MAX_PRODUCTOS} productos.`
  if (n.productoIds.some((id) => !UUID.test(id))) return 'Hay un producto inválido en la lista.'
  return null
}

function revalidarBlog(...slugs: (string | undefined)[]) {
  revalidatePath('/blog')
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/blog/${slug}`)
  revalidatePath('/sitemap.xml')
}

// Alta y edición por el mismo camino: el id lo genera la página de "Nueva
// nota" antes de guardar, para que la foto se pueda subir desde el primer
// momento (el uploader necesita saber a qué carpeta va).
export async function guardarNota(input: NotaInput): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const nota = {
    ...input,
    titulo: input.titulo.trim(),
    slug: input.slug.trim(),
    bajada: input.bajada.trim(),
    cuerpo: input.cuerpo.trim(),
    productoIds: [...new Set(input.productoIds)],
  }
  const error = validar(nota)
  if (error) return { ok: false, error }

  const { data: existente, error: errLeer } = await supabase
    .from('blog_posts')
    .select('slug, publicado_at')
    .eq('id', nota.id)
    .maybeSingle()
  if (errLeer) return { ok: false, error: 'No se pudo leer la nota. ¿Corriste la migración 0037?' }

  const fila = {
    slug: nota.slug,
    titulo: nota.titulo,
    bajada: nota.bajada,
    imagen: nota.imagen,
    cuerpo: nota.cuerpo,
    producto_ids: nota.productoIds,
    publicado: nota.publicado,
    // La fecha que se muestra es la de la PRIMERA publicación: despublicar y
    // volver a publicar para corregir algo no la mueve.
    publicado_at: existente?.publicado_at ?? (nota.publicado ? new Date().toISOString() : null),
  }

  const { error: errGuardar } = existente
    ? await supabase.from('blog_posts').update(fila).eq('id', nota.id)
    : await supabase.from('blog_posts').insert({ id: nota.id, ...fila })
  if (errGuardar) {
    if (errGuardar.code === '23505') return { ok: false, error: 'Ya hay otra nota con esa dirección. Cambiala.' }
    return { ok: false, error: 'No se pudo guardar la nota.' }
  }

  revalidarBlog(nota.slug, existente?.slug)
  return { ok: true }
}

export async function borrarNota(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (!UUID.test(id)) return { ok: false, error: 'Nota inválida.' }

  const { data, error } = await supabase.from('blog_posts').delete().eq('id', id).select('slug').maybeSingle()
  if (error) return { ok: false, error: 'No se pudo borrar la nota.' }

  revalidarBlog(data?.slug)
  return { ok: true }
}
