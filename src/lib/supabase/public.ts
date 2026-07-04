import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

// Cliente de Supabase para LECTURAS PÚBLICAS del catálogo (sin cookies ni
// sesión). Existe por dos motivos:
//   1. El cliente de server.ts lee cookies() en cada llamada, y Next no permite
//      cookies() adentro de unstable_cache — este cliente sí es cacheable.
//   2. El catálogo/home no necesitan la sesión del usuario: todo lo que leen
//      (productos, items_catalogo, producto_items) tiene RLS de lectura pública.
//
// Usa la service role key, NO la anon key, para evitar que RLS le rompa el
// plan al planner en consultas agregadas. Es seguro: este módulo solo se
// importa desde Server Components/Actions (nunca desde código de cliente) y
// cada función que lo usa (src/lib/productos.ts) ya filtra explícitamente
// `activo` a mano, así que no se expone nada que RLS estuviera bloqueando.
// Nunca usar este cliente para escribir ni para datos privados.
let client: SupabaseClient<Database> | null = null

export function createClient(): SupabaseClient<Database> {
  if (!client) {
    client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return client
}
