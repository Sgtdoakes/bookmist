import { getDestacados, getNovedades, getProductosPorCategoria, getProductosPorIds } from '@/lib/productos'
import { BestSellersScroller } from '@/components/public/best-sellers-scroller'
import { resolverFondo, resolverRadio, resolverTamano } from '@/lib/estilo-secciones'
import type { Producto } from '@/types/db'
import type { ProductosConfig, ProductosFuente } from '@/lib/secciones'

async function resolverProductos(
  fuente: ProductosFuente,
  categoria: string,
  ids: string[],
  limite: number,
): Promise<Producto[]> {
  switch (fuente) {
    case 'destacados':
      return getDestacados(limite)
    case 'novedades':
      return getNovedades(limite)
    case 'categoria':
      return getProductosPorCategoria(categoria, limite)
    case 'manual':
      return getProductosPorIds(ids)
  }
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
  estilo,
}: ProductosConfig) {
  const items = await resolverProductos(fuente, categoria, productos, limite)
  if (items.length === 0) return null

  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const conFondo = !!estilo?.fondo && estilo.fondo !== 'transparente'

  return (
    <section className="w-full">
      <div className={`mx-auto max-w-7xl px-6 md:px-10 ${tamano.padding}`}>
        <div className={`${fondoClase} ${radioClase} ${conFondo ? 'p-6 md:p-10' : ''}`}>
          <BestSellersScroller eyebrow={eyebrow} titulo={titulo} productos={items} />
        </div>
      </div>
    </section>
  )
}
