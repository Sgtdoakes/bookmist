import { getSeccionesAdmin, previewSecciones, getPaginasAdmin } from './actions'
import { getProductosActivos } from '@/lib/productos'
import { PageBuilder } from '@/components/admin/page-builder'

export const metadata = { title: 'Contenido de las páginas' }

type Props = { searchParams: Promise<{ pagina?: string }> }

export default async function AdminPaginaPage({ searchParams }: Props) {
  const { pagina: paginaParam } = await searchParams
  const [paginas, productosDisponibles] = await Promise.all([getPaginasAdmin(), getProductosActivos()])
  const pagina = paginas.some((p) => p.slug === paginaParam) ? paginaParam! : 'home'

  const secciones = await getSeccionesAdmin(pagina)
  const previewInicial = await previewSecciones(secciones.map((s) => ({ id: s.id, tipo: s.tipo, config: s.config })))

  return (
    <div className="h-[calc(100vh-65px)] overflow-hidden">
      <PageBuilder
        key={pagina}
        pagina={pagina}
        paginas={paginas}
        inicial={secciones}
        previewInicial={previewInicial}
        productosDisponibles={productosDisponibles}
      />
    </div>
  )
}
