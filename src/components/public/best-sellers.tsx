import { getDestacados } from '@/lib/productos'
import { BestSellersScroller } from '@/components/public/best-sellers-scroller'
import type { MasVendidosConfig } from '@/lib/secciones'
import type { Producto } from '@/types/db'

// Vista pura (sin fetch) — la usan tanto el wrapper público de abajo como
// el lienzo en vivo del admin (con productos ya resueltos vía
// `previewSecciones`).
export function BestSellersView({
  eyebrow,
  titulo,
  productos,
}: {
  eyebrow: string
  titulo: string
  productos: Producto[]
}) {
  if (productos.length === 0) return null

  return (
    <section className="w-full border-t border-foreground/10 bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <BestSellersScroller eyebrow={eyebrow} titulo={titulo} productos={productos} />
      </div>
    </section>
  )
}

// Server component: trae productos reales de Supabase (no un array
// hardcodeado). Si todavía no hay productos destacados cargados, la sección
// se oculta sola en vez de mostrarse vacía.
export async function BestSellers({ eyebrow, titulo }: MasVendidosConfig) {
  const productos = await getDestacados(12)
  return <BestSellersView eyebrow={eyebrow} titulo={titulo} productos={productos} />
}
