import { createClient } from '@/lib/supabase/server'
import type { NotaBlog, Producto } from '@/types/db'

// Lecturas del panel del blog (con la sesión de Dani, ven también los
// borradores). `null` en la lista = la tabla no se pudo leer, que en la
// práctica es la migración 0037 sin correr: el panel lo dice en vez de
// mostrar un blog vacío que parece andar.
export async function getNotasAdmin(): Promise<NotaBlog[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').select('*').order('updated_at', { ascending: false })
  return error ? null : (data ?? [])
}

export async function getNotaAdmin(id: string): Promise<NotaBlog | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle()
  return error ? null : data
}

// Solo los productos a la venta: linkear uno pausado manda al lector a una
// ficha que no existe.
export async function getProductosParaNota(): Promise<Producto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').select('*').eq('activo', true).order('nombre')
  return error ? [] : (data ?? [])
}
