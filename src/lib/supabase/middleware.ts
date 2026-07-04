import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/db'

// Refresca la sesión de Supabase en cada request.
// TODO Fase 5: cuando exista /admin con auth, agregar acá la protección de
// rutas (redirigir a /admin/login sin sesión), igual patrón que Martín Libros.
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Si todavía no se configuró Supabase (.env.local), no intentamos validar
  // sesión: dejamos pasar para que la app levante igual en desarrollo.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: no poner código entre createServerClient y getUser().
  await supabase.auth.getUser()

  return response
}
