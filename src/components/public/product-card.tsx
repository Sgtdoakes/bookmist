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
        {/* Sin el autor, la tarjeta de un libro no se distingue de cualquier
            otro producto. Atado al tipo y no solo a que el campo tenga algo:
            hay kits viejos con un autor cargado de la biblioteca anterior, y
            ahí el nombre de una persona no significa nada. El botón sigue
            alineado entre tarjetas por el mt-auto de abajo.
            text-card-foreground y NO text-muted-foreground: la tarjeta tiene
            fondo claro y ese token está pensado para el fondo oscuro del sitio
            — medido, daba 1,2:1 de contraste (ilegible). */}
        {producto.tipo === 'libro' && producto.autor && (
          <p className="mb-1.5 line-clamp-1 text-xs text-card-foreground/70">{producto.autor}</p>
        )}
        <p className="mb-4 font-heading text-xl font-semibold text-primary">{formatARS(producto.precio)}</p>
        <div className="mt-auto">
          <AddToCart producto={producto} />
        </div>
      </div>
    </div>
  )
}
