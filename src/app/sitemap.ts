import type { MetadataRoute } from 'next'
import { getProductosActivos } from '@/lib/productos'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'

// Home, catálogo general y una entrada por producto activo.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productos = await getProductosActivos()

  const entradas: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/productos`, changeFrequency: 'daily', priority: 0.9 },
  ]

  for (const p of productos) {
    entradas.push({
      url: `${siteUrl}/productos/${p.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return entradas
}
