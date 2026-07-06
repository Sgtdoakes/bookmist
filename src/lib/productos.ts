import { createClient } from '@/lib/supabase/public'
import type { Producto, ProductoConItems } from '@/types/db'

// Capa de datos del catálogo (lado servidor). Degrada con elegancia: si
// Supabase todavía no está configurado o falla, devuelve valores vacíos en
// vez de romper la página (mismo patrón que Martín Libros).

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function isSupabaseConfigured() {
  return configured()
}

export async function getDestacados(limit = 12): Promise<Producto[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('destacado', true)
      .order('orden', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// Catálogo completo (página /productos).
export async function getProductosActivos(): Promise<Producto[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

export async function getProductoBySlug(slug: string): Promise<Producto | null> {
  if (!configured()) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('slug', slug)
      .eq('activo', true)
      .maybeSingle()
    if (error) throw error
    return data
  } catch {
    return null
  }
}

// Producto + su contenido curado ("qué incluye"), para la página de detalle.
export async function getProductoConItems(slug: string): Promise<ProductoConItems | null> {
  if (!configured()) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, producto_items(*, items_catalogo(*))')
      .eq('slug', slug)
      .eq('activo', true)
      .order('orden', { referencedTable: 'producto_items', ascending: true })
      .maybeSingle()
    if (error) throw error
    return data as ProductoConItems | null
  } catch {
    return null
  }
}

// Últimos productos cargados (fuente "novedades" del bloque de productos).
export async function getNovedades(limit = 12): Promise<Producto[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// Productos de una categoría puntual (fuente "categoria" del bloque de productos).
export async function getProductosPorCategoria(categoria: string, limit = 12): Promise<Producto[]> {
  if (!configured() || !categoria) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('categoria', categoria)
      .order('orden', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// Selección manual de productos (fuente "manual" del bloque de productos) —
// preserva el orden elegido por Dani, no el orden de la tabla.
export async function getProductosPorIds(ids: string[]): Promise<Producto[]> {
  if (!configured() || ids.length === 0) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('productos').select('*').eq('activo', true).in('id', ids)
    if (error) throw error
    const porId = new Map((data ?? []).map((p) => [p.id, p]))
    return ids.map((id) => porId.get(id)).filter((p): p is Producto => !!p)
  } catch {
    return []
  }
}

export async function getCategoriasDistintas(): Promise<string[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('categorias_distintas')
    if (error) throw error
    return (data ?? [])
      .map((r) => r.categoria)
      .filter((c): c is string => !!c)
      .sort((a, b) => a.localeCompare(b, 'es'))
  } catch {
    return []
  }
}
