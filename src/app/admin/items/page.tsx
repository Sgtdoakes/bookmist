import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ItemsManager } from '@/components/admin/items-manager'
import { getProductosParaSelector } from '@/app/admin/items/actions'
import type { ItemCatalogo } from '@/types/db'

export const metadata = { title: 'Biblioteca de libros y accesorios' }

async function getItemsAdmin(): Promise<ItemCatalogo[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('items_catalogo')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

export default async function AdminItemsPage() {
  const [items, productosDisponibles] = await Promise.all([getItemsAdmin(), getProductosParaSelector()])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Biblioteca de libros y accesorios</h1>
      <p className="mt-1 text-muted-foreground">
        Los ítems que después elegís para armar el contenido (&quot;qué incluye&quot;) de cada caja/kit.
      </p>

      <div className="mt-6">
        <ItemsManager itemsIniciales={items} productosDisponibles={productosDisponibles} />
      </div>
    </div>
  )
}
