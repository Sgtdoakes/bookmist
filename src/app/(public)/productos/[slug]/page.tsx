import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookOpen, Gift } from 'lucide-react'
import { getProductoConItems, getRelacionados } from '@/lib/productos'
import type { ProductoTipo } from '@/types/db'
import { ProductGallery } from '@/components/public/product-gallery'
import { AddToCart } from '@/components/public/add-to-cart'
import { ProductCard } from '@/components/public/product-card'
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

const TIPO_LABEL: Record<ProductoTipo, string> = {
  caja: 'Caja literaria',
  kit: 'Kit',
  libro: 'Libro',
  accesorio: 'Accesorio',
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params
  const producto = await getProductoConItems(slug)
  if (!producto) notFound()

  const contenido = [...producto.producto_items].sort((a, b) => a.orden - b.orden)
  const relacionados = await getRelacionados(producto, 4)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery
          imagenPrincipal={producto.imagen_principal}
          imagenesGaleria={producto.imagenes_galeria}
          nombre={producto.nombre}
        />

        <div>
          <p className="font-script mb-1 text-xl text-muted">{TIPO_LABEL[producto.tipo]}</p>
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
                    {pi.item.autor ? (
                      <BookOpen size={16} className="mt-0.5 shrink-0 text-muted" />
                    ) : (
                      <Gift size={16} className="mt-0.5 shrink-0 text-muted" />
                    )}
                    <span>
                      {pi.cantidad > 1 ? `${pi.cantidad}× ` : ''}
                      {pi.item.nombre}
                      {pi.item.autor ? ` — ${pi.item.autor}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AddToCart producto={producto} showQuantity />
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">Productos relacionados</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {relacionados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-16">
        <SeccionesDePagina pagina="producto_detalle" />
      </div>
    </div>
  )
}
