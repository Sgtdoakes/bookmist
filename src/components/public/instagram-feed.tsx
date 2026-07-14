import { getPostsInstagram, type PostInstagram } from '@/lib/instagram'
import { InstagramFeedView } from '@/components/public/instagram-feed-view'
import type { InstagramConfig } from '@/lib/secciones'

// Resuelve los posts reales — separado del render para poder llamarlo desde
// previewSecciones() y alimentar el lienzo del admin con los mismos datos
// que ve el sitio público (mismo patrón que resolverProductosBloque).
export async function resolverInstagramFeed(): Promise<PostInstagram[]> {
  return getPostsInstagram(10)
}

// Wrapper async para el sitio público: resuelve y renderiza con el mismo
// componente puro que usa el lienzo del admin.
export async function InstagramFeed({ titulo, estilo }: InstagramConfig) {
  const posts = await resolverInstagramFeed()
  return <InstagramFeedView titulo={titulo} posts={posts} estilo={estilo} />
}
