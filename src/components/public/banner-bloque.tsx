import Link from 'next/link'
import { PrimaryButton } from '@/components/public/buttons'
import { MediaVisual } from '@/components/public/media-visual'
import {
  resolverAlineacion,
  resolverFondo,
  resolverRadio,
  resolverTamano,
  paddingTopVars,
  tieneFondo,
} from '@/lib/estilo-secciones'
import type { BannerConfig } from '@/lib/secciones'

// Banner libre (imagen de fondo opcional + overlay oscuro, o color de fondo
// si no hay foto) — para promos/anuncios en cualquier página.
//
// Modo "solo imagen": si hay imagen y NINGÚN texto, la placa se muestra
// entera, con su proporción real y sin oscurecer. Nace de un pedido de Dani:
// el overlay fijo de abajo lavaba cualquier foto que subiera, así que para
// tener un banner presentable terminaba fabricando un fondo plano en
// Illustrator. Con esto puede diseñar la placa completa y mostrarla tal cual.
// Los banners que sí tienen texto siguen exactamente igual que antes: el
// overlay es lo que hace legible el título encima de una foto.
export function BannerBloque({ eyebrow, titulo, texto, imagen, ctaTexto, ctaHref, estilo }: BannerConfig) {
  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const alineacion = resolverAlineacion(estilo)

  if (imagen && !eyebrow && !titulo && !texto && !ctaTexto) {
    return (
      <section data-fondo={tieneFondo(estilo)} style={paddingTopVars(estilo)} className="w-full">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className={`overflow-hidden ${radioClase}`}>
            {/* alt vacío: la placa no tiene ningún texto cargado del que sacarlo,
                y un alt inventado sería peor que ninguno para un lector de
                pantalla. Si la placa lleva información importante, hace falta
                un campo de texto alternativo en el panel. */}
            <MediaVisual url={imagen} alt="" sizes="100vw" className="" natural />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section data-fondo={tieneFondo(estilo)} style={paddingTopVars(estilo)} className="w-full">
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
