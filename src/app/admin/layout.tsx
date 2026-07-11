import Link from 'next/link'
import { headers } from 'next/headers'
import { BookOpen, LogOut } from 'lucide-react'
import { cerrarSesion } from './actions'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // El proxy (src/proxy.ts) ya validó la sesión contra Supabase y redirige
  // a /login si no hay usuario, o afuera de /login si sí lo hay — para
  // cuando este layout renderiza, el pathname solo puede ser /admin/login
  // sin sesión. Confiar en eso evita un segundo round-trip de auth.getUser()
  // en cada navegación del panel.
  const pathname = (await headers()).get('x-pathname')

  // Página de login: sin chrome del panel.
  if (pathname === '/admin/login') {
    return <div className="flex-1">{children}</div>
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-foreground/12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            Panel
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-foreground/70 hover:text-foreground">
              Ver sitio
            </Link>
            <form action={cerrarSesion}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
