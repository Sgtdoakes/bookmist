import type { MarcaConfig } from '@/lib/configuracion'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'

// Bookmist no tiene local físico (a diferencia de Martín Libros), así que la
// entidad estructurada es una Organization/OnlineStore genérica, sin
// PostalAddress ni horarios.
export function organizationJsonLd(marca: MarcaConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: marca.nombre,
    url: siteUrl,
    email: marca.email,
    sameAs: [marca.instagram, marca.tiktok].filter(Boolean),
  }
}
