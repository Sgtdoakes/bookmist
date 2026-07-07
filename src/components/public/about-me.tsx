import { Blob, FeatherDoodle } from '@/components/public/decorative'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { resolverAlineacion, resolverFondo, resolverTamano } from '@/lib/estilo-secciones'
import type { SobreMiConfig } from '@/lib/secciones'

export function AboutMe({ eyebrow, titulo, texto, texto2, firma, estilo }: SobreMiConfig) {
  const fondoClase = estilo?.fondo ? resolverFondo(estilo) : 'bg-background'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-16 md:py-24'
  const alineacion = resolverAlineacion(estilo)
  const textoAlineado = estilo?.alineacion ? `flex flex-col ${alineacion.items} ${alineacion.texto}` : ''

  return (
    <section className={`relative w-full overflow-hidden ${fondoClase} ${padding}`}>
      <Blob className="absolute top-10 right-0 h-64 w-64 animate-[floaty_14s_ease-in-out_infinite_-4s] text-muted opacity-10" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <div className="relative">
          <ImgPlaceholder label="Foto de perfil / taller" className="h-80 w-full rounded-3xl shadow-xl md:h-96" />
          <FeatherDoodle className="absolute -bottom-6 -right-6 hidden h-20 w-14 text-muted md:block" />
        </div>

        <div className={textoAlineado}>
          <p className="font-script mb-1 text-2xl text-muted">{eyebrow}</p>
          <h2 className="mb-5 font-heading text-3xl font-semibold text-foreground md:text-4xl">{titulo}</h2>
          <p className="mb-4 text-base leading-relaxed text-foreground">{texto}</p>
          <p className="mb-6 text-base leading-relaxed text-foreground/75">{texto2}</p>
          <p className="font-script text-2xl text-muted">{firma}</p>
        </div>
      </div>
    </section>
  )
}
