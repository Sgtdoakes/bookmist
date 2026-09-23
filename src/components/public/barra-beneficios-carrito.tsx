'use client'

import { Check, CreditCard, Truck } from 'lucide-react'
import { useBeneficios } from '@/components/public/beneficios-precio'
import { metasDelCarrito, progresoDelCarrito, type EstadoMeta } from '@/lib/beneficios'
import { formatARS } from '@/lib/format'
import { cn } from '@/lib/utils'

// Pedido de Dani: que el carrito muestre, a medida que se suman cosas, cuánto
// falta para el envío gratis y para las cuotas sin interés. Una sola barra con
// una marca por meta: la barra entera es la meta más lejana.
//
// El subtotal que recibe es el de productos a precio de lista, sin envío ni
// descuentos — el mismo contra el que el checkout decide el envío gratis, así
// que la barra nunca promete algo que después no se cobra así.
export function BarraBeneficiosCarrito({ subtotal }: { subtotal: number }) {
  const beneficios = useBeneficios()
  if (!beneficios) return null

  const metas = metasDelCarrito(beneficios)
  if (metas.length === 0) return null

  const progreso = progresoDelCarrito(subtotal, metas)
  const cantidadCuotas = Math.floor(beneficios.cuotas.cantidad)
  const nombre = (m: EstadoMeta) => (m.tipo === 'envio' ? 'envío gratis' : `${cantidadCuotas} cuotas sin interés`)
  const alcanzadas = progreso.metas.filter((m) => m.alcanzada)

  const { siguiente } = progreso
  let mensaje: React.ReactNode
  if (!siguiente) {
    mensaje = <>¡Tenés {alcanzadas.map(nombre).join(' y ')}! 🎉</>
  } else {
    const falta = <strong className="font-bold">{formatARS(siguiente.falta)}</strong>
    const objetivo = <strong className="font-bold">{nombre(siguiente)}</strong>
    mensaje =
      alcanzadas.length === 0 ? (
        <>
          Te faltan {falta} para {siguiente.tipo === 'envio' ? <>el {objetivo}</> : <>pagar en {objetivo}</>}.
        </>
      ) : (
        <>
          ¡Ya tenés {alcanzadas.map(nombre).join(' y ')}! Sumá {falta} más y{' '}
          {siguiente.tipo === 'envio' ? (
            <>
              el envío es <strong className="font-bold">gratis</strong>
            </>
          ) : (
            <>pagás en {objetivo}</>
          )}
          .
        </>
      )
  }

  return (
    <div className="rounded-2xl border border-foreground/10 p-4 sm:p-5">
      <p className="text-sm text-foreground" aria-live="polite">
        {mensaje}
      </p>

      <div className="relative mt-4 mb-1 px-3">
        <div
          role="progressbar"
          aria-label="Progreso hacia los beneficios de tu compra"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso.porcentaje)}
          className="h-2.5 overflow-hidden rounded-full bg-foreground/15"
        >
          <div
            className="h-full rounded-full bg-muted transition-[width] duration-500 ease-out"
            style={{ width: `${progreso.porcentaje}%` }}
          />
        </div>
        {progreso.metas.map((m) => (
          <span
            key={m.tipo}
            aria-hidden
            className={cn(
              'absolute top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-colors duration-300',
              m.alcanzada ? 'border-muted bg-muted text-background' : 'border-foreground/30 bg-background text-foreground/70',
            )}
            // El contenedor tiene px-3 para que la marca del 100% no se salga
            // por la derecha: la posición se calcula sobre el ancho interno.
            style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${m.posicion / 100})` }}
          >
            {m.tipo === 'envio' ? <Truck size={14} /> : <CreditCard size={14} />}
          </span>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-foreground/75">
        {progreso.metas.map((m) => (
          <li key={m.tipo} className={cn('flex items-center gap-1.5', m.alcanzada && 'text-foreground')}>
            {m.alcanzada ? (
              <Check size={14} className="text-muted" />
            ) : m.tipo === 'envio' ? (
              <Truck size={14} />
            ) : (
              <CreditCard size={14} />
            )}
            <span>
              {m.tipo === 'envio' ? 'Envío gratis' : `${cantidadCuotas} cuotas sin interés con Mercado Pago`} desde{' '}
              {formatARS(m.monto)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
