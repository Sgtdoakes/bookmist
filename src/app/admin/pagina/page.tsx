import { getSeccionesAdmin, previewSecciones } from './actions'
import { getProductosActivos } from '@/lib/productos'
import { PageBuilder } from '@/components/admin/page-builder'

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

  const [secciones, productosDisponibles] = await Promise.all([getSeccionesAdmin(pagina), getProductosActivos()])
  const previewInicial = await previewSecciones(secciones.map((s) => ({ id: s.id, tipo: s.tipo, config: s.config })))

  return (
    <div className="h-[calc(100vh-65px)] overflow-hidden">
      <PageBuilder
        pagina={pagina}
        paginas={PAGINAS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))}
        inicial={secciones}
        previewInicial={previewInicial}
        productosDisponibles={productosDisponibles}
      />
    </div>
  )
}
