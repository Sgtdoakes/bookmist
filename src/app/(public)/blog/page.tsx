import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MediaVisual } from '@/components/public/media-visual'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { fechaDeNota, getNotasPublicadas } from '@/lib/blog'

// Mismo criterio que home/catálogo: una nota publicada desde el panel aparece
// sola (el guardado además revalida /blog al instante).
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notas, recomendaciones de lectura y novedades de Bookmist, tienda literaria.',
  alternates: { canonical: '/blog' },
}

export default async function BlogPage() {
  const notas = await getNotasPublicadas()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <header className="mb-10 text-center">
        <p className="font-script mb-1 text-2xl text-muted">Para leer entre capítulos</p>
        <h1 className="font-heading text-4xl font-semibold text-foreground md:text-5xl">Blog</h1>
      </header>

      {notas.length === 0 ? (
        <p className="text-center text-foreground/75">Todavía no hay notas publicadas. ¡Muy pronto!</p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2">
          {notas.map((n) => (
            <li key={n.id}>
              <Link
                href={`/blog/${n.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-md transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] w-full shrink-0">
                  {n.imagen ? (
                    <MediaVisual url={n.imagen} alt={n.titulo} sizes="(max-width: 640px) 100vw, 50vw" />
                  ) : (
                    <ImgPlaceholder label="" className="aspect-[16/10] w-full" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  {n.publicado_at && (
                    <p className="mb-2 text-xs font-semibold tracking-wide text-card-foreground/70 uppercase">
                      {fechaDeNota(n.publicado_at)}
                    </p>
                  )}
                  <h2 className="font-heading text-xl leading-snug font-semibold text-card-foreground md:text-2xl">
                    {n.titulo}
                  </h2>
                  {n.bajada && <p className="mt-2 line-clamp-3 text-sm text-card-foreground/80">{n.bajada}</p>}
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-primary group-hover:underline">
                    Leer nota <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
