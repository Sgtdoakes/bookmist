import { createClient } from '@/lib/supabase/public'
import type { PaginaRow } from '@/types/db'

// Segmentos de ruta que ya existen fijos en el código (fuera de la carpeta
// (public)/[slug]) — una página institucional con uno de estos slugs nunca
// sería alcanzable en su propia URL (la ruta fija siempre gana), así que se
// rechaza al crearla en vez de dejar una página fantasma sin acceso.
export const SLUGS_RESERVADOS = ['admin', 'productos', 'carrito', 'checkout', 'pedido', 'mantenimiento', 'api']

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Lectura pública (ruta dinámica /[slug]) — null si no existe, está
// inactiva, o Supabase no está configurado.
export async function getPaginaPorSlug(slug: string): Promise<PaginaRow | null> {
  if (!configured()) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('paginas')
      .select('*')
      .eq('slug', slug)
      .eq('activo', true)
      .maybeSingle()
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}
