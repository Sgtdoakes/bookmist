'use client'

import { createContext, useContext } from 'react'
import { cuotasSinInteres, precioConTransferencia, type BeneficiosPrecio } from '@/lib/beneficios'
import { formatARS } from '@/lib/format'
import { cn } from '@/lib/utils'

// El layout público lee la config una sola vez (getBeneficiosPrecio) y la
// reparte por contexto: la tarjeta de producto se dibuja en una docena de
// lugares distintos (bloques de la home, catálogo, relacionados, blog) y
// pasarle tres números por props a cada uno sería un cable por bloque.
// Fuera del sitio público (el lienzo del panel) no hay proveedor y los
// renglones simplemente no se dibujan.
const BeneficiosContext = createContext<BeneficiosPrecio | null>(null)

export function BeneficiosProvider({ value, children }: { value: BeneficiosPrecio; children: React.ReactNode }) {
  return <BeneficiosContext.Provider value={value}>{children}</BeneficiosContext.Provider>
}

export function useBeneficios() {
  return useContext(BeneficiosContext)
}

// Los renglones de abajo del precio: con transferencia y, desde el mínimo, en
// cuántas cuotas sin interés queda. `sobre` elige el color según el fondo: la
// tarjeta es clara y el resto del sitio es oscuro (text-muted-foreground está
// pensado para el fondo oscuro y sobre la tarjeta queda ilegible).
export function PrecioBeneficios({
  precio,
  sobre,
  className,
}: {
  precio: number
  sobre: 'tarjeta' | 'fondo'
  className?: string
}) {
  const beneficios = useBeneficios()
  if (!beneficios) return null

  const transferencia = precioConTransferencia(precio, beneficios.descuentoTransferenciaPct)
  const cuotas = cuotasSinInteres(precio, beneficios.cuotas)
  if (transferencia === null && cuotas === null) return null

  const tono = sobre === 'tarjeta' ? 'text-card-foreground/75' : 'text-foreground/80'
  const fuerte = sobre === 'tarjeta' ? 'text-card-foreground' : 'text-foreground'

  return (
    <div className={cn('space-y-0.5 leading-snug', tono, className)}>
      {transferencia !== null && (
        <p>
          <span className={cn('font-semibold', fuerte)}>{formatARS(transferencia)}</span> con transferencia
        </p>
      )}
      {cuotas !== null && (
        <p>
          {cuotas.cantidad} cuotas sin interés de{' '}
          <span className={cn('font-semibold', fuerte)}>{formatARS(cuotas.monto)}</span>
        </p>
      )}
    </div>
  )
}
