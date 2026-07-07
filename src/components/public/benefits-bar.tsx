import { resolverFondo, resolverTamano } from '@/lib/estilo-secciones'
import type { BeneficiosConfig } from '@/lib/secciones'

export function BenefitsBar({ items, estilo }: BeneficiosConfig) {
  const fondoClase = estilo?.fondo ? resolverFondo(estilo) : 'bg-background'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-8 md:py-12'

  return (
    <section className={`w-full ${fondoClase} ${padding}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-4 md:px-10">
        {items.map((b, i) => (
          <div
            key={b.texto}
            className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2 text-center md:gap-2 md:px-4 ${
              i !== 0 ? 'border-l border-muted' : ''
            }`}
          >
            <span className="text-lg md:text-2xl">{b.emoji}</span>
            <p className="text-xs font-bold leading-tight text-foreground md:text-sm">{b.texto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
