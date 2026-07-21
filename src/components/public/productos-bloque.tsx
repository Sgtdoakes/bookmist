import { getDestacados, getNovedades, getProductosActivos, getProductosPorCategoria, getProductosPorIds } from '@/lib/productos'
import { BestSellersScroller } from '@/components/public/best-sellers-scroller'
import { resolverFondo, resolverRadio, resolverTamano, paddingTopVars, tieneFondo } from '@/lib/estilo-secciones'
import type { EstiloBloque } from '@/lib/estilo-secciones'
import type { Producto } from '@/types/db'
import type { ProductosConfig, ProductosFuente } from '@/lib/secciones'

// Resuelve la fuente configurada a productos reales — separado del render
// para poder llamarlo desde una server action (`previewSecciones`) y
// alimentar el lienzo en vivo del admin con los mismos datos que ve el
// sitio público.
export async function resolverProductosBloque(config: {
  fuente: ProductosFuente
  categoria: string
  productos: string[]
  limite: number
}): Promise<Producto[]> {
  switch (config.fuente) {
    case 'todos':
      return getProductosActivos(config.limite)
    case 'destacados':
      return getDestacados(config.limite)
    case 'novedades':
      return getNovedades(config.limite)
    case 'categoria':
      return getProductosPorCategoria(config.categoria, config.limite)
    case 'manual':
      return getProductosPorIds(config.productos)
  }
}

// Vista pura (sin fetch): recibe los productos YA resueltos. La usan tanto
// el wrapper público de abajo como el lienzo en vivo del admin.
export function ProductosBloqueView({
  eyebrow,
  titulo,
  productos,
  ctaTexto,
  ctaHref,
  estilo,
  anclaId,
}: {
  eyebrow: string
  titulo: string
  productos: Producto[]
  ctaTexto?: string
  ctaHref?: string
  estilo: EstiloBloque
  anclaId?: string
}) {
  if (productos.length === 0) return null

  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const conFondo = !!estilo?.fondo && estilo.fondo !== 'transparente'

  return (
    <section
      data-fondo={tieneFondo(estilo)}
      style={paddingTopVars(estilo)}
      className="w-full"
      id={anclaId || undefined}
    >
      <div className={`mx-auto max-w-7xl px-6 md:px-10 ${tamano.padding}`}>
        <div className={`${fondoClase} ${radioClase} ${conFondo ? 'p-6 md:p-10' : ''}`}>
          <BestSellersScroller
            eyebrow={eyebrow}
            titulo={titulo}
            productos={productos}
            ctaTexto={ctaTexto}
            ctaHref={ctaHref}
          />
        </div>
      </div>
    </section>
  )
}

// Carrusel de productos con fuente configurable — la misma UI de "Más
// vendidos" (BestSellersScroller), pero reutilizable con cualquier criterio
// de selección y estilo propio, en vez de estar atado a "destacados".
export async function ProductosBloque({
  eyebrow,
  titulo,
  fuente,
  categoria,
  productos,
  limite,
  ctaTexto,
  ctaHref,
  estilo,
  anclaId,
}: ProductosConfig) {
  const items = await resolverProductosBloque({ fuente, categoria, productos, limite })
  return (
    <ProductosBloqueView
      eyebrow={eyebrow}
      titulo={titulo}
      productos={items}
      ctaTexto={ctaTexto}
      ctaHref={ctaHref}
      estilo={estilo}
      anclaId={anclaId}
    />
  )
}
