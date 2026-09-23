import type { MarcaConfig } from '@/lib/configuracion'
import type { NotaBlog, ProductoConItems } from '@/types/db'
import { SITE_URL } from '@/lib/constants'
import { codigoDeIdioma } from '@/lib/isbn-formato'
import { enUnaLinea } from '@/lib/format'

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

// El nombre que Google pone arriba de cada resultado ("site name"). Sin esto
// mostraba el dominio pelado, "bookmist.com.ar". Google elige entre `name` y
// los `alternateName`, y prefiere uno corto: la marca va sola en `name`, y la
// versión con "Tienda Literaria" queda como alternativa aceptada.
export function websiteJsonLd(marca: MarcaConfig, titulo: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: marca.nombre,
    alternateName: [titulo, new URL(SITE_URL).hostname],
    url: SITE_URL,
  }
}

// Una nota del blog. Autor y editor son la marca: las notas las escribe Dani
// como Bookmist, no con firma propia.
export function blogPostingJsonLd(
  nota: Pick<NotaBlog, 'slug' | 'titulo' | 'bajada' | 'imagen' | 'publicado_at' | 'updated_at'>,
  marca: MarcaConfig,
  descripcion: string,
) {
  const url = `${SITE_URL}/blog/${nota.slug}`
  const organizacion = {
    '@type': 'Organization',
    name: marca.nombre,
    url: SITE_URL,
    ...(marca.logoUrl && { logo: marca.logoUrl }),
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: nota.titulo,
    description: descripcion || undefined,
    image: nota.imagen ?? undefined,
    datePublished: nota.publicado_at ?? undefined,
    dateModified: nota.updated_at,
    author: organizacion,
    publisher: organizacion,
    mainEntityOfPage: url,
    url,
    inLanguage: 'es-AR',
  }
}

// Product/Offer por ficha de producto — precio en ARS y disponibilidad según
// stock real, para que Google pueda mostrar precio/stock en resultados
// (rich results de e-commerce).
// Un libro además es un Book, no solo un Product: con `author` e `isbn`, Google
// puede mostrarlo como libro (y enlazarlo con otras ediciones del mismo título)
// en vez de como un producto cualquiera. Se declaran los dos tipos a la vez —
// la Offer de abajo sigue valiendo igual, que es lo que muestra precio y stock.
const BOOK_FORMAT: Record<string, string> = {
  blanda: 'https://schema.org/Paperback',
  dura: 'https://schema.org/Hardcover',
}

function datosDeLibro(producto: ProductoConItems) {
  if (producto.tipo !== 'libro') return {}
  return {
    '@type': ['Product', 'Book'],
    ...(producto.autor && { author: { '@type': 'Person', name: producto.autor } }),
    ...(producto.isbn && { isbn: producto.isbn }),
    ...(producto.editorial && {
      publisher: { '@type': 'Organization', name: producto.editorial },
    }),
    ...(producto.paginas && { numberOfPages: producto.paginas }),
    ...(producto.anio_publicacion && { datePublished: String(producto.anio_publicacion) }),
    // Código BCP 47, que es lo que pide schema.org — el nombre legible que se
    // muestra en la ficha ("Español") no es un valor válido acá.
    ...(codigoDeIdioma(producto.idioma) && { inLanguage: codigoDeIdioma(producto.idioma) }),
    ...(producto.formato && BOOK_FORMAT[producto.formato]
      ? { bookFormat: BOOK_FORMAT[producto.formato] }
      : {}),
  }
}

export function productJsonLd(producto: ProductoConItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    ...datosDeLibro(producto),
    name: producto.nombre,
    // Sin saltos de línea: acá la descripción es un dato para Google, no
    // texto maquetado (los párrafos se ven en la ficha, no en el JSON-LD).
    description: enUnaLinea(producto.descripcion) || undefined,
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
