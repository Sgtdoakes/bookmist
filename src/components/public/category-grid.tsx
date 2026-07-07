import Image from 'next/image'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { resolverAlineacion, resolverFondo, resolverTamano } from '@/lib/estilo-secciones'
import type { CategoriasConfig } from '@/lib/secciones'

// Grilla de categorías de navegación (no confundir con el género literario de
// cada producto): son las 3 grandes familias de la marca. Título/subtítulo/
// foto de cada tarjeta se editan desde el admin (bloque "Categorías").
export function CategoryGrid({ eyebrow, titulo, categorias, estilo }: CategoriasConfig) {
  const fondoClase = estilo?.fondo ? resolverFondo(estilo) : 'bg-background'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-14 md:py-24'
  const headerAlineado = estilo?.alineacion ? resolverAlineacion(estilo).texto : 'text-center'

  return (
    <section className={`w-full ${fondoClase} ${padding}`}>
      <div className="mx-auto max-w-7xl px-4 md:px-10">
        <div className={`mb-8 md:mb-12 ${headerAlineado}`}>
          <p className="font-script mb-1 text-xl text-muted md:text-2xl">{eyebrow}</p>
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-4xl">{titulo}</h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5 md:gap-7">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className="group relative h-44 cursor-pointer overflow-hidden rounded-xl shadow-lg sm:h-64 md:h-96 md:rounded-3xl"
            >
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                {cat.imagen ? (
                  <Image src={cat.imagen} alt={cat.titulo} fill sizes="(max-width: 768px) 33vw, 400px" className="object-cover" />
                ) : (
                  <ImgPlaceholder label={cat.titulo} dark iconSize={16} className="h-full w-full" />
                )}
              </div>
              <div className="absolute inset-0 flex flex-col justify-end rounded-xl bg-[linear-gradient(to_top,rgba(61,50,88,0.92)_0%,rgba(61,50,88,0.15)_55%,rgba(61,50,88,0)_100%)] p-2.5 md:rounded-3xl md:p-7">
                <h3 className="mb-0.5 font-heading text-xs font-semibold leading-tight text-foreground sm:text-lg md:mb-1 md:text-2xl">
                  {cat.titulo}
                </h3>
                <p className="hidden text-xs text-muted sm:block md:text-sm">{cat.subtitulo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
