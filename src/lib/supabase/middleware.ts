import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/db'
import { getModoMantenimiento } from '@/lib/mantenimiento'

// Refresca la sesión de Supabase en cada request y protege las rutas /admin.
export async function updateSession(request: NextRequest) {
  // Reenviamos el pathname como header para que Server Components downstream
  // (ej. admin/layout.tsx) puedan leerlo con headers() sin volver a llamar
  // auth.getUser() — el proxy ya es la única fuente de verdad de la sesión.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  let response = NextResponse.next({ request: { headers: requestHeaders } })

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
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: no poner código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const esAdmin = path.startsWith('/admin')
  const esLogin = path === '/admin/login'

  // Sin sesión y entrando al panel => al login.
  if (esAdmin && !esLogin && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // Con sesión y entrando al login => al panel.
  if (esLogin && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // Modo "reponiendo stock": tapa el sitio público para todos menos el admin
  // logueado. /admin, /api y la propia página de mantenimiento nunca se
  // gatean (el webhook de Mercado Pago tiene que poder llegar siempre, y el
  // admin necesita poder entrar a desactivarlo).
  const esApi = path.startsWith('/api')
  const esMantenimiento = path === '/mantenimiento'
  if (!esAdmin && !esApi && !esMantenimiento && !user) {
    const { activo } = await getModoMantenimiento()
    if (activo) {
      const url = request.nextUrl.clone()
      url.pathname = '/mantenimiento'
      return NextResponse.rewrite(url)
    }
  }

  return response
}
