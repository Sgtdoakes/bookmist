import Image from 'next/image'
import Link from 'next/link'
import { PrimaryButton } from '@/components/public/buttons'
import { resolverAlineacion, resolverFondo, resolverRadio, resolverTamano } from '@/lib/estilo-secciones'
import type { ElementoLibre, LibreConfig } from '@/lib/secciones'

const ALTO_ESPACIO: Record<'sm' | 'md' | 'lg', string> = { sm: 'h-6', md: 'h-12', lg: 'h-24' }

// Bloque "Libre": sin esquema fijo — un stack de piezas sueltas
// (título/párrafo/imagen/botón/espacio) que Dani arma y reordena a gusto.
// Puramente presentacional: recibe los elementos ya resueltos, sin tocar
// la base — se puede renderizar igual en el lienzo del admin y en el sitio.
export function LibreBloque({ elementos, estilo }: LibreConfig) {
  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const alineacion = resolverAlineacion(estilo)
  const conFondo = !!estilo?.fondo && estilo.fondo !== 'transparente'

  return (
    <section className="w-full">
      <div className={`mx-auto max-w-3xl px-6 md:px-10 ${tamano.padding}`}>
        <div
          className={`flex flex-col gap-4 ${alineacion.items} ${alineacion.texto} ${fondoClase} ${radioClase} ${
            conFondo ? 'p-8 md:p-12' : ''
          }`}
        >
          {elementos.map((el) => (
            <ElementoView key={el.id} elemento={el} tamano={tamano} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ElementoView({
  elemento,
  tamano,
}: {
  elemento: ElementoLibre
  tamano: ReturnType<typeof resolverTamano>
}) {
  switch (elemento.tipo) {
    case 'titulo':
      return <h2 className={`font-heading font-semibold ${tamano.titulo}`}>{elemento.texto}</h2>
    case 'parrafo':
      return <p className={`max-w-2xl leading-relaxed opacity-85 ${tamano.texto}`}>{elemento.texto}</p>
    case 'imagen':
      return elemento.url ? (
        <div className="relative h-64 w-full max-w-2xl overflow-hidden rounded-2xl">
          <Image src={elemento.url} alt="" fill sizes="(max-width: 768px) 100vw, 700px" className="object-cover" />
        </div>
      ) : null
    case 'boton':
      return elemento.texto ? (
        <Link href={elemento.href || '#'}>
          <PrimaryButton>{elemento.texto}</PrimaryButton>
        </Link>
      ) : null
    case 'espacio':
      return <div className={ALTO_ESPACIO[elemento.alto]} aria-hidden />
  }
}
