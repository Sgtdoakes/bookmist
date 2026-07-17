import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductosManager } from '@/components/admin/productos-manager'
import { CategoriasManager } from '@/components/admin/categorias-manager'
import { getCategoriasAdmin } from '@/app/admin/productos/actions'
import type { ProductoConCategorias } from '@/types/db'

export const metadata = { title: 'Catálogo de productos' }

async function getProductosAdmin(): Promise<ProductoConCategorias[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(*)')
      .order('orden', { ascending: true })
    if (error) throw error
    // Cast por el embed M2M — ver getCatalogo() en src/lib/productos.ts.
    return (data ?? []) as unknown as ProductoConCategorias[]
  } catch {
    return []
  }
}

export default async function AdminProductosPage() {
  const [productos, categorias] = await Promise.all([getProductosAdmin(), getCategoriasAdmin()])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de productos</h1>
          <p className="mt-1 text-muted-foreground">
            Editá precio/stock al instante, o entrá a un producto para editar todo (incluido
            &quot;qué incluye&quot;).
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Nuevo producto
        </Link>
      </div>

      <div className="mt-6">
        <CategoriasManager categoriasIniciales={categorias} />
      </div>

      <div className="mt-6">
        <ProductosManager productosIniciales={productos} />
      </div>
    </div>
  )
}
