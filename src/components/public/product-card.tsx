import { ShoppingBag } from 'lucide-react'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { PrimaryButton } from '@/components/public/buttons'
import { formatARS } from '@/lib/format'
import type { Producto } from '@/types/db'

export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <div className="w-64 flex-shrink-0 overflow-hidden rounded-2xl bg-card shadow-md md:w-72">
      <ImgPlaceholder label={producto.imagen_principal ? '' : 'Imagen producto'} className="h-56 w-full" />
      <div className="p-5">
        <h3 className="mb-1.5 text-sm font-semibold leading-snug text-card-foreground">{producto.nombre}</h3>
        <p className="mb-4 font-heading text-xl font-semibold text-primary">{formatARS(producto.precio)}</p>
        <PrimaryButton className="w-full justify-center">
          <ShoppingBag size={16} /> Agregar
        </PrimaryButton>
      </div>
    </div>
  )
}
