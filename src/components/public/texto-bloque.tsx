import Link from 'next/link'
import { PrimaryButton } from '@/components/public/buttons'
import {
  resolverAlineacion,
  resolverFondo,
  resolverRadio,
  resolverTamano,
  paddingTopVars,
  tieneFondo,
} from '@/lib/estilo-secciones'
import type { TextoConfig } from '@/lib/secciones'

// Bloque editorial libre: título + texto + CTA opcional, con estilo
// (fondo/tamaño/radio/alineación) editable desde el admin. Los hijos no
// fijan color propio — heredan el `color` que pone la clase de fondo, así
// funciona con cualquier combinación sin quedar ilegible.
export function TextoBloque({ eyebrow, titulo, texto, ctaTexto, ctaHref, estilo }: TextoConfig) {
  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const alineacion = resolverAlineacion(estilo)
  const conFondo = !!estilo?.fondo && estilo.fondo !== 'transparente'

  return (
    <section data-fondo={tieneFondo(estilo)} style={paddingTopVars(estilo)} className="w-full">
      <div className={`mx-auto max-w-4xl px-6 md:px-10 ${tamano.padding}`}>
        <div
          className={`flex flex-col ${alineacion.items} ${alineacion.texto} ${fondoClase} ${radioClase} ${
            conFondo ? 'p-8 md:p-12' : ''
          }`}
        >
          {eyebrow && <p className="font-script mb-1 text-2xl opacity-75">{eyebrow}</p>}
          {titulo && <h2 className={`font-heading font-semibold ${tamano.titulo}`}>{titulo}</h2>}
          {texto && <p className={`mt-4 max-w-2xl leading-relaxed opacity-85 ${tamano.texto}`}>{texto}</p>}
          {ctaTexto && ctaHref && (
            <Link href={ctaHref} className="mt-6">
              <PrimaryButton>{ctaTexto}</PrimaryButton>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
