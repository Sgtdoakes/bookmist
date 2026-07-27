import Link from 'next/link'
import Image from 'next/image'
import type { Producto } from '@/types/db'

type Props = {
  actual: Producto
  otrasVariantes: Producto[]
}

// Botones para saltar de una variante a otra dentro del mismo kit (ej.
// colores) — se muestra el producto actual también, marcado como
// seleccionado, para que se entienda que es un selector y no solo links de
// "relacionados".
export function SelectorVariantes({ actual, otrasVariantes }: Props) {
  if (otrasVariantes.length === 0) return null

  const variantes = [actual, ...otrasVariantes].sort((a, b) =>
    (a.variante_etiqueta ?? a.nombre).localeCompare(b.variante_etiqueta ?? b.nombre, 'es'),
  )

  return (
    <div className="mb-6">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-foreground">Elegí tu variante</h2>
      <div className="flex flex-wrap gap-2">
        {variantes.map((v) => {
          const esActual = v.id === actual.id
          return (
            <Link
              key={v.id}
              href={`/productos/${v.slug}`}
              aria-current={esActual ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-lg border p-1.5 pr-3 text-sm transition-colors ${
                esActual
                  ? 'border-primary bg-primary/10 font-medium text-foreground'
                  : 'border-foreground/16 text-foreground/85 hover:bg-foreground/5'
              }`}
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted/30">
                {v.imagen_principal && (
                  <Image src={v.imagen_principal} alt="" fill sizes="40px" className="object-cover" />
                )}
              </span>
              {v.variante_etiqueta || v.nombre}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
