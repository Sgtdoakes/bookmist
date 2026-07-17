import Link from 'next/link'
import { PrimaryButton } from '@/components/public/buttons'
import { MediaVisual } from '@/components/public/media-visual'
import { resolverAlineacion, resolverFondo, resolverRadio, resolverTamano } from '@/lib/estilo-secciones'
import type { BannerConfig } from '@/lib/secciones'

// Banner libre (imagen de fondo opcional + overlay oscuro, o color de fondo
// si no hay foto) — para promos/anuncios en cualquier página.
export function BannerBloque({ eyebrow, titulo, texto, imagen, ctaTexto, ctaHref, estilo }: BannerConfig) {
  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const alineacion = resolverAlineacion(estilo)

  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className={`relative overflow-hidden ${radioClase} ${imagen ? '' : fondoClase}`}>
          {imagen && (
            <>
              <MediaVisual url={imagen} alt="" sizes="100vw" />
              <div className="absolute inset-0 bg-black/45" />
            </>
          )}
          <div
            className={`relative flex flex-col px-6 md:px-12 ${alineacion.items} ${alineacion.texto} ${
              tamano.padding
            } ${imagen ? 'text-foreground' : ''}`}
          >
            {eyebrow && <p className="font-script mb-1 text-2xl opacity-80">{eyebrow}</p>}
            {titulo && <h2 className={`font-heading font-semibold ${tamano.titulo}`}>{titulo}</h2>}
            {texto && <p className={`mt-3 max-w-xl opacity-90 ${tamano.texto}`}>{texto}</p>}
            {ctaTexto && ctaHref && (
              <Link href={ctaHref} className="mt-6">
                <PrimaryButton>{ctaTexto}</PrimaryButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
