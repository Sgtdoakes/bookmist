import { getDestacados } from '@/lib/productos'
import { BestSellersScroller } from '@/components/public/best-sellers-scroller'
import { resolverFondo, resolverTamano } from '@/lib/estilo-secciones'
import type { EstiloBloque } from '@/lib/estilo-secciones'
import type { MasVendidosConfig } from '@/lib/secciones'
import type { Producto } from '@/types/db'

// Vista pura (sin fetch) — la usan tanto el wrapper público de abajo como
// el lienzo en vivo del admin (con productos ya resueltos vía
// `previewSecciones`).
export function BestSellersView({
  eyebrow,
  titulo,
  productos,
  estilo,
}: {
  eyebrow: string
  titulo: string
  productos: Producto[]
  estilo?: EstiloBloque
}) {
  if (productos.length === 0) return null
  const fondoClase = estilo?.fondo ? resolverFondo(estilo) : 'bg-background'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-16 md:py-24'

  return (
    <section className={`w-full border-t border-foreground/10 ${fondoClase} ${padding}`}>
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <BestSellersScroller eyebrow={eyebrow} titulo={titulo} productos={productos} />
      </div>
    </section>
  )
}

// Server component: trae productos reales de Supabase (no un array
// hardcodeado). Si todavía no hay productos destacados cargados, la sección
// se oculta sola en vez de mostrarse vacía.
export async function BestSellers({ eyebrow, titulo, estilo }: MasVendidosConfig) {
  const productos = await getDestacados(12)
  return <BestSellersView eyebrow={eyebrow} titulo={titulo} productos={productos} estilo={estilo} />
}
