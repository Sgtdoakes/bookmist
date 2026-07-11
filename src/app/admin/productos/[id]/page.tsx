import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductoForm } from '@/components/admin/producto-form'
import { getCategoriasAdmin, getProductosParaContenido } from '@/app/admin/productos/actions'
import type { ProductoConItems } from '@/types/db'

export const metadata = { title: 'Editar producto' }

async function getProductoAdmin(id: string): Promise<ProductoConItems | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('productos')
      // Doble hint de FK: ver getProductoConItems() en src/lib/productos.ts
      .select(
        '*, producto_items!producto_items_producto_id_fkey(*, item:productos!producto_items_item_id_fkey(*)), categorias(*)',
      )
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
  const [producto, itemsDisponibles, categoriasDisponibles] = await Promise.all([
    getProductoAdmin(id),
    getProductosParaContenido(id),
    getCategoriasAdmin(),
  ])
  if (!producto) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/productos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>
      <h1 className="text-2xl font-bold">Editar producto</h1>
      <div className="mt-6">
        <ProductoForm producto={producto} itemsDisponibles={itemsDisponibles} categoriasDisponibles={categoriasDisponibles} />
      </div>
    </div>
  )
}
