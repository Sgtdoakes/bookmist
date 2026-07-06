import { Fragment } from 'react'
import { Hero } from '@/components/public/hero'
import { BenefitsBar } from '@/components/public/benefits-bar'
import { CategoryGrid } from '@/components/public/category-grid'
import { BestSellers } from '@/components/public/best-sellers'
import { AboutMe } from '@/components/public/about-me'
import { Reviews } from '@/components/public/reviews'
import { InstagramFeed } from '@/components/public/instagram-feed'
import { TextoBloque } from '@/components/public/texto-bloque'
import { ProductosBloque } from '@/components/public/productos-bloque'
import { BannerBloque } from '@/components/public/banner-bloque'
import { Divider } from '@/components/public/decorative'
import { getSeccionesPagina, type SeccionResuelta } from '@/lib/secciones'

// Separadores decorativos: solo tienen sentido en el diseño original de la
// home (van pegados adelante de estos dos bloques fijos), así que no se
// aplican en las páginas nuevas (catálogo/ficha de producto).
const DIVIDER_ANTES = new Set(['categorias', 'resenas'])

// Punto único de renderizado de los bloques de una página — lo usan la home,
// el catálogo y la ficha de producto, cada uno con su propio valor de
// `pagina` en `pagina_secciones`.
export async function SeccionesDePagina({
  pagina,
  conDivisores = false,
}: {
  pagina: string
  conDivisores?: boolean
}) {
  const secciones = await getSeccionesPagina(pagina)

  return (
    <>
      {secciones.map((s) => (
        <Fragment key={s.id}>
          {conDivisores && DIVIDER_ANTES.has(s.tipo) && <Divider />}
          <RenderSeccion seccion={s} />
        </Fragment>
      ))}
    </>
  )
}

function RenderSeccion({ seccion: s }: { seccion: SeccionResuelta }) {
  switch (s.tipo) {
    case 'hero':
      return <Hero {...s.config} />
    case 'beneficios':
      return <BenefitsBar {...s.config} />
    case 'categorias':
      return <CategoryGrid {...s.config} />
    case 'mas_vendidos':
      return <BestSellers {...s.config} />
    case 'sobre_mi':
      return <AboutMe {...s.config} />
    case 'resenas':
      return <Reviews {...s.config} />
    case 'instagram':
      return <InstagramFeed {...s.config} />
    case 'texto':
      return <TextoBloque {...s.config} />
    case 'productos':
      return <ProductosBloque {...s.config} />
    case 'banner':
      return <BannerBloque {...s.config} />
    default:
      return null
  }
}
