import Link from 'next/link'
import { Package, Library, ShoppingBag, Truck, AlertTriangle, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">¿Qué querés hacer?</h1>
      <p className="mt-1 text-muted-foreground">Elegí una opción.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Accion
          href="/admin/productos"
          icon={<Package className="h-8 w-8" />}
          titulo="Cajas y kits"
          desc="Editá precios y stock, o cargá un producto nuevo"
        />
        <Accion
          href="/admin/items"
          icon={<Library className="h-8 w-8" />}
          titulo="Biblioteca de libros y accesorios"
          desc="Los ítems reusables que arman el contenido de cada caja/kit"
        />
        <Accion
          href="/admin/pedidos"
          icon={<ShoppingBag className="h-8 w-8" />}
          titulo="Pedidos"
          desc="Mirá y gestioná los pedidos que van entrando"
        />
        <Accion
          href="/admin/zonas"
          icon={<Truck className="h-8 w-8" />}
          titulo="Zonas de envío"
          desc="Editá las zonas y sus costos"
        />
        <Accion
          href="/admin/mantenimiento"
          icon={<AlertTriangle className="h-8 w-8" />}
          titulo="Modo reponiendo stock"
          desc="Pausá la tienda a mano o mirá si se activó sola"
        />
        <Accion
          href="/admin/pagina"
          icon={<LayoutTemplate className="h-8 w-8" />}
          titulo="Página de inicio"
          desc="Arrastrá para reordenar, ocultá y editá el texto de cada sección"
        />
      </div>
    </div>
  )
}

function Accion({
  href,
  icon,
  titulo,
  desc,
}: {
  href: string
  icon: React.ReactNode
  titulo: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col rounded-xl border p-6 transition-colors hover:border-primary hover:bg-foreground/10',
      )}
    >
      <span className="text-primary">{icon}</span>
      <span className="mt-3 text-lg font-semibold">{titulo}</span>
      <span className="mt-1 text-sm text-muted-foreground">{desc}</span>
    </Link>
  )
}
