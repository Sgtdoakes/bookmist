import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/db'

// Cliente de Supabase para el navegador (Client Components). Mismo
// placeholder defensivo que server.ts si Supabase todavía no está
// configurado (createBrowserClient también tira sincrónico con URL/key vacías).
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'supabase-no-configurado'
  return createBrowserClient<Database>(url, anonKey)
}
