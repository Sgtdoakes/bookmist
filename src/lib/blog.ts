import { createClient } from '@/lib/supabase/public'
import type { NotaBlog } from '@/types/db'

// Lecturas públicas del blog. Mismo cliente (service role, cacheable) y mismo
// criterio que el catálogo: el filtro publicado = true va a mano en cada
// consulta. Sin Supabase, o si la tabla todavía no existe (migración 0037 sin
// correr), el blog queda vacío en vez de romper la página.

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

export type NotaResumen = Pick<NotaBlog, 'id' | 'slug' | 'titulo' | 'bajada' | 'imagen' | 'publicado_at' | 'updated_at'>

export async function getNotasPublicadas(): Promise<NotaResumen[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, titulo, bajada, imagen, publicado_at, updated_at')
      .eq('publicado', true)
      .order('publicado_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

export async function getNotaPublicada(slug: string): Promise<NotaBlog | null> {
  if (!configured()) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('publicado', true)
      .maybeSingle()
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}

// "23 de septiembre de 2026". Con zona horaria fija: el servidor de Vercel
// corre en UTC y una nota publicada a las 22 hs se fecharía al día siguiente.
const FECHA = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
})

export function fechaDeNota(iso: string | null): string {
  return iso ? FECHA.format(new Date(iso)) : ''
}
