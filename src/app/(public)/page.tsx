import { Fragment } from 'react'
import { Hero } from '@/components/public/hero'
import { BenefitsBar } from '@/components/public/benefits-bar'
import { CategoryGrid } from '@/components/public/category-grid'
import { BestSellers } from '@/components/public/best-sellers'
import { AboutMe } from '@/components/public/about-me'
import { Reviews } from '@/components/public/reviews'
import { InstagramFeed } from '@/components/public/instagram-feed'
import { Divider } from '@/components/public/decorative'
import { getSeccionesPagina, type SeccionResuelta } from '@/lib/secciones'

// ISR: sin esto, el orden/contenido de las secciones quedaría estático desde
// el build y un cambio guardado en /admin/pagina no aparecería hasta el
// próximo deploy.
export const revalidate = 300

// Separadores decorativos entre algunas secciones (no son su propio bloque
// editable: van pegados adelante del bloque que los sigue en el diseño
// original de Dani).
const DIVIDER_ANTES = new Set(['categorias', 'resenas'])

export default async function HomePage() {
  const secciones = await getSeccionesPagina('home')

  return (
    <>
      {secciones.map((s) => (
        <Fragment key={s.id}>
          {DIVIDER_ANTES.has(s.tipo) && <Divider />}
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
    default:
      return null
  }
}
