import { createClient } from '@/lib/supabase/public'
import type { Producto } from '@/types/db'

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
