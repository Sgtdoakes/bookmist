import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductoForm } from '@/components/admin/producto-form'
import { getCategoriasAdmin, getProductosParaContenido } from '@/app/admin/productos/actions'

export const metadata = { title: 'Nuevo producto' }

export default async function NuevoProductoPage() {
  const [itemsDisponibles, categoriasDisponibles] = await Promise.all([
    getProductosParaContenido(),
    getCategoriasAdmin(),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/productos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>
      <h1 className="text-2xl font-bold">Nuevo producto</h1>
      <div className="mt-6">
        <ProductoForm itemsDisponibles={itemsDisponibles} categoriasDisponibles={categoriasDisponibles} />
      </div>
    </div>
  )
}
