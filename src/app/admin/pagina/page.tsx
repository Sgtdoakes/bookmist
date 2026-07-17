import { getSeccionesAdmin, previewSecciones, getPaginasAdmin } from './actions'
import { getProductosActivos, getCategorias } from '@/lib/productos'
import { getMarcaConfig, getNavLinks } from '@/lib/configuracion'
import { PageBuilder } from '@/components/admin/page-builder'

export const metadata = { title: 'Contenido de las páginas' }

type Props = { searchParams: Promise<{ pagina?: string }> }

export default async function AdminPaginaPage({ searchParams }: Props) {
  const { pagina: paginaParam } = await searchParams
  // Las secciones se piden optimistamente para el slug crudo de la URL, en
  // paralelo con todo lo demás — cada helper hace su propio auth.getUser()
  // (un viaje de red extra), así que cada paso secuencial que se evita
  // ahorra bastante latencia. Solo si el slug no existe (URL tipeada a
  // mano) se re-pide para 'home'.
  const paginaPedida = paginaParam ?? 'home'
  const [paginas, seccionesPedidas, productosDisponibles, categoriasDisponibles, marca, navLinks] =
    await Promise.all([
      getPaginasAdmin(),
      getSeccionesAdmin(paginaPedida),
      getProductosActivos(),
      getCategorias(),
      getMarcaConfig(),
      getNavLinks(),
    ])
  const pagina = paginas.some((p) => p.slug === paginaPedida) ? paginaPedida : 'home'
  const secciones = pagina === paginaPedida ? seccionesPedidas : await getSeccionesAdmin(pagina)

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
        categoriasDisponibles={categoriasDisponibles}
        marca={marca}
        navLinks={navLinks}
      />
    </div>
  )
}
