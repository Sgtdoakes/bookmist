import { createClient } from '@/lib/supabase/public'
import type { Categoria, Producto, ProductoConCategorias, ProductoConItems } from '@/types/db'

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

// "Destacados" es una categoría más desde la Fase 6i (antes era un boolean
// aparte) — el `!inner` hace que el filtro sobre la categoría embebida
// restrinja los productos devueltos, no solo el contenido del embed.
export async function getDestacados(limit = 12): Promise<Producto[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias!inner(slug)')
      .eq('activo', true)
      .eq('categorias.slug', 'destacados')
      .order('orden', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// Catálogo completo (página /productos, y fuente "todos" del bloque de
// productos — sin límite por defecto: es pensado para "mostrame todo".
export async function getProductosActivos(limit?: number): Promise<Producto[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    let query = supabase.from('productos').select('*').eq('activo', true).order('orden', { ascending: true })
    if (limit) query = query.limit(limit)
    const { data, error } = await query
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

// Producto + su contenido curado ("qué incluye") + categorías, para la
// página de detalle (las categorías alimentan "productos relacionados").
export async function getProductoConItems(slug: string): Promise<ProductoConItems | null> {
  if (!configured()) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      // Doble hint de FK: producto_items tiene DOS foreign keys hacia productos
      // (producto_id e item_id), así que ambos embeds necesitan desambiguarse.
      .select(
        '*, producto_items!producto_items_producto_id_fkey(*, item:productos!producto_items_item_id_fkey(*)), categorias(*)',
      )
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

// Productos de una categoría puntual, por nombre (fuente "categoria" del
// bloque de productos — los configs guardados referencian el nombre, que se
// mantiene como identificador visible).
export async function getProductosPorCategoria(categoria: string, limit = 12): Promise<Producto[]> {
  if (!configured() || !categoria) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias!inner(nombre)')
      .eq('activo', true)
      .eq('categorias.nombre', categoria)
      .order('orden', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

// Catálogo completo con categorías embebidas — la fuente del bloque
// "catálogo" interactivo (buscador/orden/rango de precios en el cliente).
export async function getCatalogo(): Promise<ProductoConCategorias[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(*)')
      .eq('activo', true)
      .order('orden', { ascending: true })
    if (error) throw error
    // El generador de tipos de supabase-js no infiere el embed many-to-many
    // (productos -> categorias vía producto_categorias); en runtime PostgREST
    // sí lo resuelve. Cast explícito, mismo criterio que ProductoConItems.
    return (data ?? []) as unknown as ProductoConCategorias[]
  } catch {
    return []
  }
}

// Relacionados de una ficha: productos que comparten alguna categoría real
// con el actual ("Destacados" no cuenta como parentesco — es una vidriera,
// no una temática).
export async function getRelacionados(producto: ProductoConItems, limit = 4): Promise<Producto[]> {
  if (!configured()) return []
  const slugs = (producto.categorias ?? []).map((c) => c.slug).filter((s) => s !== 'destacados')
  if (slugs.length === 0) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias!inner(slug)')
      .eq('activo', true)
      .in('categorias.slug', slugs)
      .neq('id', producto.id)
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

// Categorías reales (tabla propia desde la Fase 6i), en el orden definido
// en el admin. Reemplaza al viejo RPC categorias_distintas sobre texto libre.
export async function getCategorias(): Promise<Categoria[]> {
  if (!configured()) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}
