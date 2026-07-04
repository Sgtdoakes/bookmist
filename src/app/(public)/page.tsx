import { Hero } from '@/components/public/hero'
import { BenefitsBar } from '@/components/public/benefits-bar'
import { CategoryGrid } from '@/components/public/category-grid'
import { BestSellers } from '@/components/public/best-sellers'
import { AboutMe } from '@/components/public/about-me'
import { Reviews } from '@/components/public/reviews'
import { InstagramFeed } from '@/components/public/instagram-feed'
import { Divider } from '@/components/public/decorative'

// Sin esto, la home queda estática para siempre desde el build: un producto
// nuevo o un cambio de stock cargado en Supabase no se vería hasta el
// próximo deploy. Con ISR, Next revalida en segundo plano cada 5 minutos.
export const revalidate = 300

export default function HomePage() {
  return (
    <>
      <Hero />
      <BenefitsBar />
      <Divider />
      <CategoryGrid />
      <BestSellers />
      <AboutMe />
      <Divider />
      <Reviews />
      <InstagramFeed />
    </>
  )
}
