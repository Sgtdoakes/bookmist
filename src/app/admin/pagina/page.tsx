import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SeccionesManager } from '@/components/admin/secciones-manager'
import { getSeccionesAdmin } from './actions'
import { getProductosActivos } from '@/lib/productos'

export const metadata = { title: 'Contenido de las páginas' }

const PAGINAS = [
  { valor: 'home', etiqueta: 'Home' },
  { valor: 'productos', etiqueta: 'Catálogo' },
  { valor: 'producto_detalle', etiqueta: 'Ficha de producto' },
] as const

type Props = { searchParams: Promise<{ pagina?: string }> }

export default async function AdminPaginaPage({ searchParams }: Props) {
  const { pagina: paginaParam } = await searchParams
  const pagina = PAGINAS.some((p) => p.valor === paginaParam) ? paginaParam! : 'home'

  const [secciones, productosDisponibles] = await Promise.all([
    getSeccionesAdmin(pagina),
    getProductosActivos(),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Contenido de las páginas</h1>
      <p className="mt-1 text-muted-foreground">
        Arrastrá para reordenar, ocultá lo que no quieras mostrar, editá el contenido y el estilo de
        cada bloque, o agregá bloques nuevos.
      </p>

      <div className="mt-4 flex gap-1 border-b">
        {PAGINAS.map((p) => (
          <Link
            key={p.valor}
            href={`/admin/pagina?pagina=${p.valor}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              pagina === p.valor
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.etiqueta}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <SeccionesManager pagina={pagina} seccionesIniciales={secciones} productosDisponibles={productosDisponibles} />
      </div>
    </div>
  )
}
