import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
