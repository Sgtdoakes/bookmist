import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fechaDeNota } from '@/lib/blog'
import { getNotasAdmin } from './datos'

export const metadata = { title: 'Blog' }

export default async function AdminBlogPage() {
  const notas = await getNotasAdmin()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="mt-1 text-muted-foreground">
            Notas con título, bajada, imagen, texto y links a tus productos. Se ven en{' '}
            <Link href="/blog" target="_blank" className="underline underline-offset-2">
              bookmist.com.ar/blog
            </Link>
            .
          </p>
        </div>
        {notas && (
          <Link href="/admin/blog/nueva">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva nota
            </Button>
          </Link>
        )}
      </div>

      {notas === null ? (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          El blog todavía no está activado en la base de datos: falta correr la migración{' '}
          <code>0037_blog.sql</code> en Supabase.
        </p>
      ) : notas.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay notas. Empezá con &quot;Nueva nota&quot;.
        </p>
      ) : (
        <ul className="mt-6 divide-y rounded-lg border">
          {notas.map((n) => (
            <li key={n.id}>
              <Link
                href={`/admin/blog/${n.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-foreground/5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{n.titulo}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {n.publicado ? `Publicada el ${fechaDeNota(n.publicado_at)}` : 'Borrador'}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    n.publicado ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground'
                  }`}
                >
                  {n.publicado ? 'Publicada' : 'Borrador'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {notas && notas.some((n) => n.publicado) && (
        <p className="mt-6 text-sm text-muted-foreground">
          Para que el blog aparezca en el menú de arriba del sitio, agregá un link a <code>/blog</code> en{' '}
          <Link href="/admin/configuracion" className="underline underline-offset-2">
            Configuración → Navegación
          </Link>
          .
        </p>
      )}
    </div>
  )
}
