import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductoForm } from '@/components/admin/producto-form'
import { getItemsCatalogoAdmin } from '@/app/admin/productos/actions'
import { getCategoriasDistintas } from '@/lib/productos'

export const metadata = { title: 'Nuevo producto' }

export default async function NuevoProductoPage() {
  const [itemsDisponibles, categoriasExistentes] = await Promise.all([
    getItemsCatalogoAdmin(),
    getCategoriasDistintas(),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/productos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a cajas y kits
      </Link>
      <h1 className="text-2xl font-bold">Nuevo producto</h1>
      <div className="mt-6">
        <ProductoForm itemsDisponibles={itemsDisponibles} categoriasExistentes={categoriasExistentes} />
      </div>
    </div>
  )
}
