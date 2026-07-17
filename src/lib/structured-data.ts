import type { MarcaConfig } from '@/lib/configuracion'
import type { ProductoConItems } from '@/types/db'
import { SITE_URL } from '@/lib/constants'

// Bookmist no tiene local físico (a diferencia de Martín Libros), así que la
// entidad estructurada es una Organization/OnlineStore genérica, sin
// PostalAddress ni horarios. areaServed: 'AR' señala el mercado (envíos a
// todo el país, sin local físico) para búsquedas con intención local.
export function organizationJsonLd(marca: MarcaConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: marca.nombre,
    url: SITE_URL,
    email: marca.email,
    areaServed: 'AR',
    sameAs: [marca.instagram, marca.tiktok].filter(Boolean),
  }
}

// Product/Offer por ficha de producto — precio en ARS y disponibilidad según
// stock real, para que Google pueda mostrar precio/stock en resultados
// (rich results de e-commerce).
export function productJsonLd(producto: ProductoConItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion ?? undefined,
    image: producto.imagen_principal ?? undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/productos/${producto.slug}`,
      priceCurrency: 'ARS',
      price: producto.precio,
      availability: producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }
}
