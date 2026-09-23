import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { MediaVisual } from '@/components/public/media-visual'
import { CuerpoNota } from '@/components/public/cuerpo-nota'
import { ProductCard } from '@/components/public/product-card'
import { fechaDeNota, getNotaPublicada } from '@/lib/blog'
import { minutosDeLectura, textoPlanoDelCuerpo } from '@/lib/blog-cuerpo'
import { getMarcaConfig } from '@/lib/configuracion'
import { getProductosPorIds } from '@/lib/productos'
import { blogPostingJsonLd } from '@/lib/structured-data'
import { enUnaLinea } from '@/lib/format'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

// La bajada es la descripción natural; si Dani no escribió bajada, el
// arranque del texto (Google recorta en ~160 caracteres igual).
function descripcionDe(nota: { bajada: string; cuerpo: string }) {
  return enUnaLinea(nota.bajada) || textoPlanoDelCuerpo(nota.cuerpo).slice(0, 160)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const nota = await getNotaPublicada(slug)
  if (!nota) return {}
  const description = descripcionDe(nota)
  return {
    title: nota.titulo,
    description,
    alternates: { canonical: `/blog/${nota.slug}` },
    openGraph: {
      type: 'article',
      title: nota.titulo,
      description,
      url: `/blog/${nota.slug}`,
      ...(nota.publicado_at && { publishedTime: nota.publicado_at }),
      ...(nota.imagen && { images: [{ url: nota.imagen }] }),
    },
  }
}

export default async function NotaPage({ params }: Props) {
  const { slug } = await params
  const nota = await getNotaPublicada(slug)
  if (!nota) notFound()

  const [productos, marca] = await Promise.all([getProductosPorIds(nota.producto_ids), getMarcaConfig()])
  const minutos = minutosDeLectura(nota.cuerpo)

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingJsonLd(nota, marca, descripcionDe(nota))),
        }}
      />

      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground"
      >
        <ChevronLeft size={16} />
        Blog
      </Link>

      <header>
        <h1 className="font-heading text-3xl leading-tight font-semibold text-foreground md:text-5xl">
          {nota.titulo}
        </h1>
        {nota.bajada && <p className="mt-4 text-lg leading-relaxed text-foreground/80 md:text-xl">{nota.bajada}</p>}
        <p className="mt-4 text-sm text-foreground/65">
          {fechaDeNota(nota.publicado_at)}
          {nota.publicado_at && ' · '}
          {minutos} min de lectura
        </p>
      </header>

      {nota.imagen && (
        <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl">
          <MediaVisual url={nota.imagen} alt={nota.titulo} sizes="(max-width: 768px) 100vw, 768px" />
        </div>
      )}

      {nota.cuerpo && (
        <div className="mt-10">
          <CuerpoNota cuerpo={nota.cuerpo} />
        </div>
      )}

      {productos.length > 0 && (
        <section className="mt-14 border-t border-foreground/10 pt-10">
          <p className="font-script mb-1 text-2xl text-muted">Para llevarte</p>
          <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground md:text-3xl">
            Productos de esta nota
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {productos.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
