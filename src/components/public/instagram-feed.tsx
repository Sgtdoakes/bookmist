import { getPostsInstagram, type PostInstagram } from '@/lib/instagram'
import { InstagramFeedView } from '@/components/public/instagram-feed-view'
import type { InstagramConfig, PostInstagramManual } from '@/lib/secciones'

// Instagram apunta al perfil, no a un post puntual — las fotos manuales no
// tienen un permalink real propio.
const PERFIL_INSTAGRAM = 'https://www.instagram.com/bookmist.literaria/'

function aPostsManual(posts: PostInstagramManual[]): PostInstagram[] {
  return posts
    .filter((p): p is PostInstagramManual & { imagen: string } => !!p.imagen)
    .map((p) => ({ id: p.id, imagen: p.imagen, permalink: PERFIL_INSTAGRAM }))
}

// Resuelve los posts a mostrar — separado del render para poder llamarlo
// desde previewSecciones() y alimentar el lienzo del admin con los mismos
// datos que ve el sitio público (mismo patrón que resolverProductosBloque).
// Prioridad: feed real de Instagram: si todavía no hay token conectado (o
// la API + la cache vienen vacías), cae a las fotos manuales del panel como
// respaldo temporal — el día que se conecte de verdad, estas fotos manuales
// dejan de mostrarse solas.
export async function resolverInstagramFeed(postsManual: PostInstagramManual[]): Promise<PostInstagram[]> {
  const reales = await getPostsInstagram(10)
  return reales.length > 0 ? reales : aPostsManual(postsManual)
}

// Wrapper async para el sitio público: resuelve y renderiza con el mismo
// componente puro que usa el lienzo del admin.
export async function InstagramFeed({ titulo, posts, estilo }: InstagramConfig) {
  const resueltos = await resolverInstagramFeed(posts)
  return <InstagramFeedView titulo={titulo} posts={resueltos} estilo={estilo} />
}
