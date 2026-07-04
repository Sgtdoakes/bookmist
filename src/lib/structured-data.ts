import { storeConfig } from '@/lib/store-config'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'

// Bookmist no tiene local físico (a diferencia de Martín Libros), así que la
// entidad estructurada es una Organization/OnlineStore genérica, sin
// PostalAddress ni horarios.
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: storeConfig.nombre,
    url: siteUrl,
    email: storeConfig.email,
    sameAs: [storeConfig.instagram, storeConfig.tiktok].filter(Boolean),
  }
}
