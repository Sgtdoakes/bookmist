import Link from 'next/link'
import Image from 'next/image'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { AddToCart } from '@/components/public/add-to-cart'
import { formatARS } from '@/lib/format'
import type { Producto } from '@/types/db'

export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <div className="h-full w-full overflow-hidden rounded-2xl bg-card shadow-md">
      <Link href={`/productos/${producto.slug}`} className="relative block h-56 w-full">
        {producto.imagen_principal ? (
          <Image
            src={producto.imagen_principal}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <ImgPlaceholder label="Imagen producto" className="h-56 w-full" />
        )}
      </Link>
      <div className="p-5">
        <Link href={`/productos/${producto.slug}`}>
          <h3 className="mb-1.5 text-sm font-semibold leading-snug text-card-foreground hover:underline">
            {producto.nombre}
          </h3>
        </Link>
        <p className="mb-4 font-heading text-xl font-semibold text-primary">{formatARS(producto.precio)}</p>
        <AddToCart producto={producto} />
      </div>
    </div>
  )
}
