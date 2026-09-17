import type { Metadata } from 'next'
import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { BookOpen, Gift } from 'lucide-react'
import { getProductoConItems, getRelacionados, getVariantes } from '@/lib/productos'
import type { ProductoTipo } from '@/types/db'
import { ProductGallery } from '@/components/public/product-gallery'
import { AddToCart } from '@/components/public/add-to-cart'
import { PixelEvento } from '@/components/public/pixel-evento'
import { ProductCard } from '@/components/public/product-card'
import { SelectorVariantes } from '@/components/public/selector-variantes'
import { SeccionesDePagina } from '@/components/public/secciones-renderer'
import { BotonEditarProducto } from '@/components/public/boton-editar-producto'
import { getIsAdmin } from '@/lib/admin'
import { enUnaLinea, formatARS, separarEnParrafos } from '@/lib/format'
import { fichaTecnicaDeLibro } from '@/lib/libro'
import { productJsonLd } from '@/lib/structured-data'

// ISR: sin esto, la ficha de producto queda estática desde el build.
export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const producto = await getProductoConItems(slug)
  if (!producto) return {}
  // enUnaLinea: la descripción puede venir escrita en párrafos, y los saltos
  // de línea en un meta tag son ruido (Google los recorta igual).
  const description =
    enUnaLinea(producto.descripcion) || `${producto.nombre} — envíos a todo el país desde Argentina.`
  return {
    title: producto.nombre,
    description,
    alternates: { canonical: `/productos/${producto.slug}` },
    openGraph: {
      title: producto.nombre,
      description,
      ...(producto.imagen_principal && { images: [{ url: producto.imagen_principal }] }),
    },
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
  const [relacionados, otrasVariantes, isAdmin] = await Promise.all([
    getRelacionados(producto, 4),
    getVariantes(producto),
    getIsAdmin(),
  ])
  const parrafos = separarEnParrafos(producto.descripcion)
  const ficha = fichaTecnicaDeLibro(producto)
  // Atado al tipo, no solo a que el campo tenga algo: quedan kits viejos con
  // un autor cargado de la biblioteca anterior, y ahí no significa nada.
  const muestraAutor = producto.tipo === 'libro' && !!producto.autor

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(producto)) }}
      />
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery
          imagenPrincipal={producto.imagen_principal}
          imagenesGaleria={producto.imagenes_galeria}
          nombre={producto.nombre}
        />

        <div>
          <p className="font-script mb-1 text-xl text-muted">{TIPO_LABEL[producto.tipo]}</p>
          <h1
            className={`font-heading text-3xl font-semibold text-foreground md:text-4xl ${
              muestraAutor ? 'mb-1.5' : 'mb-3'
            }`}
          >
            {producto.nombre}
          </h1>
          {/* El autor se lee acá, pegado al título, no perdido en la ficha
              técnica: en un libro es parte del nombre. */}
          {muestraAutor && <p className="mb-3 text-lg text-foreground/70">{producto.autor}</p>}
          <p className="mb-6 font-heading text-2xl font-semibold text-primary">
            {formatARS(producto.precio)}
          </p>

          <SelectorVariantes actual={producto} otrasVariantes={otrasVariantes} />

          {/* Un <p> por párrafo — whitespace-pre-line respeta además los
              saltos de línea sueltos de adentro de cada uno. */}
          {parrafos.length > 0 && (
            <div className="mb-6 space-y-4">
              {parrafos.map((parrafo, i) => (
                <p key={i} className="whitespace-pre-line text-base leading-relaxed text-foreground/85">
                  {parrafo}
                </p>
              ))}
            </div>
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

          {/* Ficha técnica: solo libros, y solo con lo que esté cargado
              (fichaTecnicaDeLibro devuelve [] si no hay nada que mostrar). */}
          {ficha.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                Ficha técnica
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                {ficha.map((fila) => (
                  <Fragment key={fila.etiqueta}>
                    <dt className="text-muted-foreground">{fila.etiqueta}</dt>
                    <dd className="text-foreground/85">{fila.valor}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          )}

          <AddToCart producto={producto} showQuantity />
          {/* ViewContent: lo que le dice a Meta qué producto miró cada
              visitante, base de los públicos de retargeting ("le mostró
              interés a esta caja y no la compró"). */}
          <PixelEvento
            evento="ViewContent"
            params={{
              content_type: 'product',
              content_ids: [producto.id],
              content_name: producto.nombre,
              value: producto.precio,
              currency: 'ARS',
            }}
          />
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

      {isAdmin && <BotonEditarProducto productoId={producto.id} nombre={producto.nombre} />}
    </div>
  )
}
