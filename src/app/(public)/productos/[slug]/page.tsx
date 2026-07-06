import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Gift } from 'lucide-react'
import { getProductoConItems } from '@/lib/productos'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { AddToCart } from '@/components/public/add-to-cart'
import { SeccionesDePagina } from '@/components/public/secciones-renderer'
import { formatARS } from '@/lib/format'

// ISR: sin esto, la ficha de producto queda estática desde el build.
export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const producto = await getProductoConItems(slug)
  if (!producto) return {}
  return {
    title: producto.nombre,
    description: producto.descripcion ?? undefined,
  }
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params
  const producto = await getProductoConItems(slug)
  if (!producto) notFound()

  const contenido = [...producto.producto_items].sort((a, b) => a.orden - b.orden)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          {producto.imagen_principal ? (
            <div className="relative h-80 w-full overflow-hidden rounded-3xl shadow-xl md:h-full">
              <Image
                src={producto.imagen_principal}
                alt={producto.nombre}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <ImgPlaceholder label="Imagen producto" className="h-80 w-full rounded-3xl shadow-xl md:h-full" />
          )}
          {producto.imagenes_galeria.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {producto.imagenes_galeria.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image src={url} alt={producto.nombre} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="font-script mb-1 text-xl text-muted">
            {producto.tipo === 'caja' ? 'Caja literaria' : 'Kit'}
          </p>
          <h1 className="mb-3 font-heading text-3xl font-semibold text-foreground md:text-4xl">
            {producto.nombre}
          </h1>
          <p className="mb-6 font-heading text-2xl font-semibold text-primary">
            {formatARS(producto.precio)}
          </p>

          {producto.descripcion && (
            <p className="mb-6 text-base leading-relaxed text-foreground/85">{producto.descripcion}</p>
          )}

          {contenido.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                Qué incluye
              </h2>
              <ul className="space-y-2">
                {contenido.map((pi) => (
                  <li key={pi.id} className="flex items-start gap-2 text-sm text-foreground/85">
                    {pi.items_catalogo.tipo === 'libro' ? (
                      <BookOpen size={16} className="mt-0.5 shrink-0 text-muted" />
                    ) : (
                      <Gift size={16} className="mt-0.5 shrink-0 text-muted" />
                    )}
                    <span>
                      {pi.cantidad > 1 ? `${pi.cantidad}× ` : ''}
                      {pi.items_catalogo.nombre}
                      {pi.items_catalogo.autor ? ` — ${pi.items_catalogo.autor}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AddToCart producto={producto} showQuantity />
        </div>
      </div>

      <div className="mt-16">
        <SeccionesDePagina pagina="producto_detalle" />
      </div>
    </div>
  )
}
