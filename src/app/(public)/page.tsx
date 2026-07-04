import { Hero } from '@/components/public/hero'
import { BenefitsBar } from '@/components/public/benefits-bar'
import { CategoryGrid } from '@/components/public/category-grid'
import { BestSellers } from '@/components/public/best-sellers'
import { AboutMe } from '@/components/public/about-me'
import { Reviews } from '@/components/public/reviews'
import { InstagramFeed } from '@/components/public/instagram-feed'
import { Divider } from '@/components/public/decorative'

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
