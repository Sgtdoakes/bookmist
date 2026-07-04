import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'

// Sitemap mínimo para esta fase: solo existe la home. Se suman entradas
// (catálogo, ficha de producto) a medida que esas páginas se construyan.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl, changeFrequency: 'daily', priority: 1 }]
}
