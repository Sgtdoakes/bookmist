import type { MetadataRoute } from 'next'
import { getProductosActivos } from '@/lib/productos'
import { getPaginasActivas } from '@/lib/paginas'
import { SITE_URL } from '@/lib/constants'

// Home, catálogo general, una entrada por producto activo y una por página
// institucional activa (Contacto/FAQ/Política de devolución/etc.).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productos, paginas] = await Promise.all([getProductosActivos(), getPaginasActivas()])

  const entradas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/productos`, changeFrequency: 'daily', priority: 0.9 },
  ]

  for (const p of productos) {
    entradas.push({
      url: `${SITE_URL}/productos/${p.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  for (const pagina of paginas) {
    entradas.push({
      url: `${SITE_URL}/${pagina.slug}`,
      changeFrequency: 'monthly',
      priority: 0.4,
    })
  }

  return entradas
}
