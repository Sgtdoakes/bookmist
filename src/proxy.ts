import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// En Next.js 16 el archivo `middleware` se renombró a `proxy` (misma función).
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Todas las rutas salvo estáticos e imágenes.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
