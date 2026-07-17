import Link from 'next/link'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { AddToCart } from '@/components/public/add-to-cart'
import { MediaVisual } from '@/components/public/media-visual'
import { formatARS } from '@/lib/format'
import type { Producto } from '@/types/db'

export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-md">
      <Link href={`/productos/${producto.slug}`} className="relative block aspect-[3/4] w-full shrink-0">
        {producto.imagen_principal ? (
          <MediaVisual url={producto.imagen_principal} alt={producto.nombre} sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <ImgPlaceholder label="Imagen producto" className="aspect-[3/4] w-full" />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/productos/${producto.slug}`}>
          <h3 className="mb-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-card-foreground hover:underline">
            {producto.nombre}
          </h3>
        </Link>
        <p className="mb-4 font-heading text-xl font-semibold text-primary">{formatARS(producto.precio)}</p>
        <div className="mt-auto">
          <AddToCart producto={producto} />
        </div>
      </div>
    </div>
  )
}
