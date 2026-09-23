import type { MetadataRoute } from 'next'
import { getProductosActivos } from '@/lib/productos'
import { getPaginasActivas } from '@/lib/paginas'
import { getNotasPublicadas } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'

// Home, catálogo general, una entrada por producto activo, una por página
// institucional activa (Contacto/FAQ/Política de devolución/etc.) y el blog
// con cada nota publicada.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productos, paginas, notas] = await Promise.all([
    getProductosActivos(),
    getPaginasActivas(),
    getNotasPublicadas(),
  ])

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

  // Sin notas, /blog es una página vacía: no vale la pena mandársela a Google.
  if (notas.length > 0) {
    entradas.push({ url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.6 })
    for (const nota of notas) {
      entradas.push({
        url: `${SITE_URL}/blog/${nota.slug}`,
        lastModified: nota.updated_at,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entradas
}
