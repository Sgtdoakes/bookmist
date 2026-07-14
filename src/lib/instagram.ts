import 'server-only'
import { createClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'

// Posts reales de @bookmist.literaria en la home, vía Instagram Graph API
// (Fase 6k). El token de larga duración (60 días) vive en `configuracion`,
// no en variables de entorno: hay que poder reescribirlo cuando se renueva,
// y un cron semanal (/api/cron/instagram-refresh) se encarga solo. Si el
// token vence o la API falla, se sirve el último feed que se trajo con
// éxito (cache) en vez de romper la sección — nunca se rompe por esto.

const CLAVES = {
  token: 'instagram_access_token',
  tokenActualizado: 'instagram_token_actualizado',
  userId: 'instagram_user_id',
  cache: 'instagram_posts_cache',
} as const

export type PostInstagram = { id: string; imagen: string; permalink: string }

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

async function leerConfig(): Promise<{
  token: string | null
  userId: string | null
  actualizado: string | null
  cache: PostInstagram[]
}> {
  const vacio = { token: null, userId: null, actualizado: null, cache: [] as PostInstagram[] }
  if (!configured()) return vacio
  const supabase = createClient()
  const { data, error } = await supabase
    .from('configuracion')
    .select('clave, valor')
    .in('clave', Object.values(CLAVES))
  if (error) return vacio
  const map = new Map((data ?? []).map((r) => [r.clave, r.valor]))
  let cache: PostInstagram[] = []
  try {
    const raw = map.get(CLAVES.cache)
    if (raw) cache = JSON.parse(raw)
  } catch {
    cache = []
  }
  return {
    token: map.get(CLAVES.token)?.trim() || null,
    userId: map.get(CLAVES.userId)?.trim() || null,
    actualizado: map.get(CLAVES.tokenActualizado)?.trim() || null,
    cache,
  }
}

export async function instagramConfigured(): Promise<boolean> {
  const { token, userId } = await leerConfig()
  return !!token && !!userId
}

// Trae los posts reales. Si falla (token vencido, red caída, lo que sea),
// devuelve el último feed que se guardó con éxito — la sección nunca queda
// rota por un error transitorio de la API de Meta.
export async function getPostsInstagram(limite = 10): Promise<PostInstagram[]> {
  const { token, userId, cache } = await leerConfig()
  if (!token || !userId) return cache

  try {
    const url =
      `https://graph.instagram.com/${userId}/media` +
      `?fields=id,media_url,thumbnail_url,permalink,media_type` +
      `&limit=${limite}&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as {
      data?: { id: string; media_url?: string; thumbnail_url?: string; permalink: string }[]
    }
    // Videos: media_url apunta al archivo de video, no sirve como <img> — se
    // usa thumbnail_url en su lugar. Imágenes/álbumes no tienen thumbnail_url,
    // caen a media_url.
    const posts: PostInstagram[] = (json.data ?? [])
      .map((p) => ({ id: p.id, imagen: p.thumbnail_url || p.media_url || '', permalink: p.permalink }))
      .filter((p) => !!p.imagen)

    if (posts.length > 0) {
      const supabase = createAdminClient()
      await supabase
        .from('configuracion')
        .upsert({ clave: CLAVES.cache, valor: JSON.stringify(posts), updated_at: new Date().toISOString() })
    }
    return posts.length > 0 ? posts : cache
  } catch (e) {
    console.error('[instagram] no se pudo traer el feed, uso la cache', e)
    return cache
  }
}

export type DecisionRenovacionToken = { accion: 'renovar' | 'esperar'; motivo: string }

// Función pura con la regla de negocio de cuándo renovar: Meta exige que el
// token tenga al menos 24hs de antigüedad para poder renovarse, y el
// renovado dura 60 días más desde ese momento — renovamos con margen (a
// partir del día 45) para no llegar nunca al límite ni depender de que el
// cron corra justo el día exacto.
export function decidirRenovacionToken(edadHoras: number): DecisionRenovacionToken {
  if (edadHoras < 24) return { accion: 'esperar', motivo: 'el token tiene menos de 24hs, todavía no se puede renovar' }
  if (edadHoras < 45 * 24) return { accion: 'esperar', motivo: 'todavía no hace falta renovar (falta para el día 45)' }
  return { accion: 'renovar', motivo: 'se acerca el vencimiento a los 60 días' }
}

// Llamado por el cron semanal (/api/cron/instagram-refresh). Nunca lo llama
// una request pública.
export async function refrescarTokenInstagram(): Promise<{ renovado: boolean; motivo: string }> {
  const { token, actualizado } = await leerConfig()
  if (!token) return { renovado: false, motivo: 'sin token configurado' }

  const edadHoras = actualizado ? (Date.now() - new Date(actualizado).getTime()) / 36e5 : Infinity
  const decision = decidirRenovacionToken(edadHoras)
  if (decision.accion === 'esperar') return { renovado: false, motivo: decision.motivo }

  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { access_token?: string }
    if (!json.access_token) throw new Error('respuesta sin access_token')

    const supabase = createAdminClient()
    const ahora = new Date().toISOString()
    await supabase.from('configuracion').upsert([
      { clave: CLAVES.token, valor: json.access_token, updated_at: ahora },
      { clave: CLAVES.tokenActualizado, valor: ahora, updated_at: ahora },
    ])
    return { renovado: true, motivo: 'token renovado por 60 días más' }
  } catch (e) {
    console.error('[instagram] fallo la renovación del token', e)
    return { renovado: false, motivo: 'la renovación falló contra la API de Meta, reintenta el próximo cron' }
  }
}
