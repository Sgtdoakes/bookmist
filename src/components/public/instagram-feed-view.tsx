import { InstagramIcon } from '@/components/public/decorative'
import { MediaVisual } from '@/components/public/media-visual'
import { resolverAlineacion, resolverFondo, resolverTamano, paddingTopVars, tieneFondo } from '@/lib/estilo-secciones'
import type { InstagramConfig } from '@/lib/secciones'
import type { PostInstagram } from '@/lib/instagram'

// Vista pura (sin fetch, sin nada server-only): recibe los posts YA
// resueltos. Vive separada de instagram-feed.tsx a propósito — ese archivo
// importa src/lib/instagram.ts (token real, cliente admin de Supabase), y
// si el lienzo del admin (componente cliente) importara algo de ese mismo
// archivo, Next arrastraría todo el módulo server-only al bundle del
// navegador y rompe el build. Acá no hay nada de eso, así que es seguro
// para el lienzo del admin y para el sitio público por igual.
export function InstagramFeedView({
  titulo,
  posts,
  estilo,
}: {
  titulo: string
  posts: PostInstagram[]
  estilo: InstagramConfig['estilo']
}) {
  if (posts.length === 0) return null

  const fondoClase = estilo?.fondo ? resolverFondo(estilo) : 'bg-background'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-16 md:py-24'
  const alineacionItems = estilo?.alineacion ? resolverAlineacion(estilo).items : 'justify-center'

  return (
    <section
      data-fondo={tieneFondo(estilo)}
      style={paddingTopVars(estilo)}
      className={`w-full border-t border-foreground/10 ${fondoClase} ${padding}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className={`mb-10 flex items-center gap-2.5 ${alineacionItems}`}>
          <InstagramIcon className="h-[22px] w-[22px] text-muted" />
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">{titulo}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square block overflow-hidden rounded-xl transition-[transform,opacity] duration-400 hover:scale-[1.03]"
            >
              <MediaVisual url={post.imagen} alt="Post de Instagram" sizes="(max-width: 768px) 33vw, 200px" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
