import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // El panel de administración, el modo mantenimiento y las páginas de
      // carrito/checkout/pedido (privadas o sin contenido indexable) no
      // deben rastrearse.
      disallow: ['/admin', '/carrito', '/checkout', '/pedido', '/mantenimiento'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
