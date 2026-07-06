import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductoForm } from '@/components/admin/producto-form'
import { getItemsCatalogoAdmin } from '@/app/admin/productos/actions'
import { getCategoriasDistintas } from '@/lib/productos'
import type { ProductoConItems } from '@/types/db'

export const metadata = { title: 'Editar producto' }

async function getProductoAdmin(id: string): Promise<ProductoConItems | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, producto_items(*, items_catalogo(*))')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as ProductoConItems | null
  } catch {
    return null
  }
}

type Props = { params: Promise<{ id: string }> }

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params
  const [producto, itemsDisponibles, categoriasExistentes] = await Promise.all([
    getProductoAdmin(id),
    getItemsCatalogoAdmin(),
    getCategoriasDistintas(),
  ])
  if (!producto) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/productos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a cajas y kits
      </Link>
      <h1 className="text-2xl font-bold">Editar producto</h1>
      <div className="mt-6">
        <ProductoForm producto={producto} itemsDisponibles={itemsDisponibles} categoriasExistentes={categoriasExistentes} />
      </div>
    </div>
  )
}
