import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPaginaPorSlug } from '@/lib/paginas'
import { SeccionesDePagina } from '@/components/public/secciones-renderer'

// ISR: sin esto, una página institucional nueva o borrada no se reflejaría
// hasta el próximo deploy — mismo criterio que home/catálogo/ficha.
export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

// Los segmentos fijos (admin, productos, carrito, checkout, pedido,
// mantenimiento, api) siempre resuelven a su propia carpeta antes de caer
// acá — Next.js prioriza rutas estáticas sobre [slug] en el mismo nivel.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pagina = await getPaginaPorSlug(slug)
  if (!pagina) return {}
  return { title: pagina.titulo }
}

export default async function PaginaInstitucionalPage({ params }: Props) {
  const { slug } = await params
  const pagina = await getPaginaPorSlug(slug)
  if (!pagina) notFound()

  return <SeccionesDePagina pagina={pagina.slug} />
}
