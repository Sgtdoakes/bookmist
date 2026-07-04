import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // El panel de administración (Fase 5) nunca debe rastrearse. Todavía no
      // existe la ruta, pero se deja preparado para no tener que acordarse
      // de agregarlo después.
      disallow: ['/admin'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
