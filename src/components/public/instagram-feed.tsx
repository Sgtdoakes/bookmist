import Image from 'next/image'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { InstagramIcon } from '@/components/public/decorative'
import { resolverAlineacion, resolverFondo, resolverTamano } from '@/lib/estilo-secciones'
import type { InstagramConfig } from '@/lib/secciones'

// Grilla con las fotos que se suban desde el admin (no la API real de
// Instagram: eso es su propio trabajo de OAuth/token-refresh, sin relación
// con el objetivo de esta fase). Sin foto cargada, cada casillero muestra un
// placeholder.
export function InstagramFeed({ titulo, posts, estilo }: InstagramConfig) {
  const fondoClase = estilo?.fondo ? resolverFondo(estilo) : 'bg-background'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-16 md:py-24'
  const alineacionItems = estilo?.alineacion ? resolverAlineacion(estilo).items : 'justify-center'

  return (
    <section className={`w-full border-t border-foreground/10 ${fondoClase} ${padding}`}>
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className={`mb-10 flex items-center gap-2.5 ${alineacionItems}`}>
          <InstagramIcon className="h-[22px] w-[22px] text-muted" />
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">{titulo}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-xl transition-[transform,opacity] duration-400 hover:scale-[1.03]"
            >
              {post.imagen ? (
                <Image src={post.imagen} alt="Post Instagram" fill sizes="(max-width: 768px) 33vw, 200px" className="object-cover" />
              ) : (
                <ImgPlaceholder label="Post Instagram" className="h-full w-full" iconSize={20} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
