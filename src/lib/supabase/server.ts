import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/db'

// Cliente de Supabase para el servidor (Server Components, Route Handlers,
// Server Actions). Usa la sesión guardada en cookies.
//
// Si todavía no se configuró Supabase (.env.local), createServerClient tira
// una excepción sincrónica apenas ve la URL/key vacías — eso rompía TODO el
// panel de administración en desarrollo sin credenciales. Se usa un
// placeholder inofensivo en ese caso: el cliente se crea igual, y cualquier
// llamada real (getUser(), etc.) falla a nivel de red — Supabase devuelve
// user: null en vez de tirar, así que el resto del código (que ya asume
// "sin user = no autenticado") sigue funcionando sin cambios.
export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'supabase-no-configurado'

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Se llamó desde un Server Component (no se pueden escribir cookies).
          // No pasa nada: el middleware se encarga de refrescar la sesión.
        }
      },
    },
  })
}
