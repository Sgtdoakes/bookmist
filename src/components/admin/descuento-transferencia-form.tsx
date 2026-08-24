'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/format'
import { textoCintillo, type CintilloConfig } from '@/lib/cintillo'
import { guardarDescuentoTransferencia } from '@/app/admin/configuracion/actions'

// El descuento automático por pagar con transferencia y la franja que lo
// anuncia arriba de todo. Van juntos en una sola tarjeta porque son la misma
// promesa vista de los dos lados — pero se guardan por separado: se puede
// apagar el cartel sin tocar el descuento, o al revés.
//
// La calculadora de al lado no es decoración: un porcentaje no dice nada
// hasta verlo en pesos sobre una venta real. Es la diferencia entre "5%" y
// "sobre una caja de 60.000 estás resignando 3.000".
export function DescuentoTransferenciaForm({ inicial }: { inicial: CintilloConfig }) {
  const [pct, setPct] = useState(String(inicial.descuentoPct))
  const [visible, setVisible] = useState(inicial.visible)
  const [texto, setTexto] = useState(inicial.texto)
  const [ejemplo, setEjemplo] = useState('60000')
  const [guardando, setGuardando] = useState(false)

  const pctNum = Number(pct)
  const pctValido = Number.isFinite(pctNum) && pctNum >= 0 && pctNum <= 100
  const montoEjemplo = Math.max(0, Number(ejemplo) || 0)
  const descuento = pctValido ? Math.round(montoEjemplo * (pctNum / 100)) : 0

  // Exactamente lo que va a mostrar el sitio con lo que hay escrito ahora
  // (misma función que usa el cintillo público, no una imitación).
  const previsualizacion = textoCintillo({
    visible,
    texto: texto.trim(),
    descuentoPct: pctValido ? pctNum : 0,
  })

  async function guardar() {
    if (!pctValido) return toast.error('El descuento va de 0 a 100.')
    setGuardando(true)
    const r = await guardarDescuentoTransferencia({ pct: pctNum, cintilloVisible: visible, cintilloTexto: texto })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Descuento por transferencia guardado')
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="font-semibold">Descuento por transferencia</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se aplica solo sobre los productos (el envío se cobra completo) y se suma al cupón, si el
          cliente además usa uno.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <Label htmlFor="descuento-transferencia-pct">Descuento (%)</Label>
          <Input
            id="descuento-transferencia-pct"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="mt-1 w-28"
          />
          <p className="mt-1 text-xs text-muted-foreground">0 = sin descuento</p>
        </div>

        <div className="min-w-[16rem] flex-1 rounded-md bg-muted/40 p-3">
          <Label htmlFor="descuento-transferencia-ejemplo" className="text-xs text-muted-foreground">
            Probalo con una venta
          </Label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Input
              id="descuento-transferencia-ejemplo"
              type="number"
              inputMode="numeric"
              min={0}
              value={ejemplo}
              onChange={(e) => setEjemplo(e.target.value)}
              className="h-9 w-32"
            />
            <span className="text-sm text-muted-foreground">de productos →</span>
          </div>
          <p className="mt-2 text-sm">
            el cliente paga <strong>{formatARS(montoEjemplo - descuento)}</strong>
            {descuento > 0 && (
              <>
                {' '}
                y vos resignás <strong>{formatARS(descuento)}</strong>
              </>
            )}
            .
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Mostrar el cintillo arriba de todo el sitio
        </label>

        {visible && (
          <div>
            <Label htmlFor="cintillo-texto">Qué dice</Label>
            <Input
              id="cintillo-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                pctValido && pctNum > 0
                  ? `Vacío = «${pctNum}% de descuento con transferencia»`
                  : 'Escribí algo o el cintillo no se muestra'
              }
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Dejalo vacío para que anuncie solo el descuento por transferencia. Si lo escribís vos
              (ej. «Envío gratis a partir de $60.000»), ese texto reemplaza al automático.
            </p>
          </div>
        )}

        <div className="rounded-md border border-dashed p-3 text-center text-sm">
          {previsualizacion ? (
            <span className="font-semibold">{previsualizacion}</span>
          ) : (
            <span className="text-muted-foreground">El cintillo no se va a ver en el sitio.</span>
          )}
        </div>
      </div>

      <Button type="button" size="sm" onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}
