'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/format'
import { cuotasSinInteres, type CuotasConfig } from '@/lib/beneficios'
import { guardarCuotasSinInteres } from '@/app/admin/configuracion/actions'

// Las cuotas que se anuncian debajo del precio de cada producto y en la barra
// del carrito. El aviso de arriba es lo más importante de la tarjeta: el
// sitio no da cuotas, las da Mercado Pago según la cuenta de Dani, y si estos
// números no coinciden con los de allá el sitio promete algo que el pago no
// cumple.
export function CuotasSinInteresForm({ inicial }: { inicial: CuotasConfig }) {
  const [cantidad, setCantidad] = useState(String(inicial.cantidad))
  const [minimo, setMinimo] = useState(String(inicial.minimo))
  const [ejemplo, setEjemplo] = useState('90200')
  const [guardando, setGuardando] = useState(false)

  const cantidadNum = Number(cantidad)
  const minimoNum = Number(minimo)
  const cantidadValida = Number.isInteger(cantidadNum) && cantidadNum >= 0 && cantidadNum <= 24
  const minimoValido = Number.isInteger(minimoNum) && minimoNum >= 0
  const precioEjemplo = Math.max(0, Number(ejemplo) || 0)
  const cuotas =
    cantidadValida && minimoValido ? cuotasSinInteres(precioEjemplo, { cantidad: cantidadNum, minimo: minimoNum }) : null

  async function guardar() {
    if (!cantidadValida) return toast.error('La cantidad de cuotas va de 0 a 24.')
    if (!minimoValido) return toast.error('El monto mínimo tiene que ser un número entero, 0 o más.')
    setGuardando(true)
    const r = await guardarCuotasSinInteres({ cantidad: cantidadNum, minimo: minimoNum })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Cuotas guardadas')
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="font-semibold">Cuotas sin interés</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se muestran debajo del precio de cada producto y en la barra del carrito.
        </p>
        <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Esto es solo el cartel. Las cuotas las da <strong>Mercado Pago</strong> según lo que tengas
          configurado en tu cuenta (Tu negocio → Costos → Cuotas sin interés): estos dos números tienen que
          ser los mismos que allá.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <Label htmlFor="cuotas-cantidad">Cantidad de cuotas</Label>
          <Input
            id="cuotas-cantidad"
            type="number"
            inputMode="numeric"
            min={0}
            max={24}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="mt-1 w-28"
          />
          <p className="mt-1 text-xs text-muted-foreground">0 = no mostrar cuotas</p>
        </div>

        <div>
          <Label htmlFor="cuotas-minimo">Desde (monto)</Label>
          <Input
            id="cuotas-minimo"
            type="number"
            inputMode="numeric"
            min={0}
            value={minimo}
            onChange={(e) => setMinimo(e.target.value)}
            className="mt-1 w-36"
          />
          <p className="mt-1 text-xs text-muted-foreground">0 = desde cualquier monto</p>
        </div>

        <div className="min-w-[16rem] flex-1 rounded-md bg-muted/40 p-3">
          <Label htmlFor="cuotas-ejemplo" className="text-xs text-muted-foreground">
            Probalo con un precio
          </Label>
          <Input
            id="cuotas-ejemplo"
            type="number"
            inputMode="numeric"
            min={0}
            value={ejemplo}
            onChange={(e) => setEjemplo(e.target.value)}
            className="mt-1 h-9 w-32"
          />
          <p className="mt-2 text-sm">
            {cuotas ? (
              <>
                Debajo del precio dice: <strong>{cuotas.cantidad} cuotas sin interés de {formatARS(cuotas.monto)}</strong>
              </>
            ) : (
              <>Con {formatARS(precioEjemplo)} no se muestran cuotas.</>
            )}
          </p>
        </div>
      </div>

      <Button type="button" size="sm" onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}
