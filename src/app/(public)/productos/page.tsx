import type { Metadata } from 'next'
import { getProductosActivos } from '@/lib/productos'
import { ProductCard } from '@/components/public/product-card'

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Todas las cajas y kits literarios de Bookmist.',
}

export default async function ProductosPage() {
  const productos = await getProductosActivos()

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
      <div className="mb-10 text-center">
        <p className="font-script mb-1 text-2xl text-muted">Nuestro catálogo</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">Cajas y kits</h1>
      </div>

      {productos.length === 0 ? (
        <p className="text-center text-muted">
          Todavía no hay productos cargados. Volvé a pasar pronto.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  )
}
