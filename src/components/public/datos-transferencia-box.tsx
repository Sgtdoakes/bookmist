'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { DatosTransferencia } from '@/lib/configuracion'

function copiar(valor: string, etiqueta: string) {
  if (!valor) return
  navigator.clipboard
    .writeText(valor)
    .then(() => toast.success(`${etiqueta} copiado`))
    .catch(() => toast.error('No se pudo copiar'))
}

// Datos reales para cerrar el pago ahí mismo (checkout y confirmación de
// pedido) — transferencia y depósito comparten la misma cuenta: mismo
// destino, distinta forma de mandarlo (online vs. en sucursal/cajero).
export function DatosTransferenciaBox({ datos }: { datos: DatosTransferencia }) {
  const filas: [string, string][] = (
    [
      ['Titular', datos.titular],
      ['Banco', datos.banco],
      ['CBU', datos.cbu],
      ['Alias', datos.alias],
    ] as [string, string][]
  ).filter(([, v]) => !!v)

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-left">
      {filas.map(([label, valor]) => (
        <div key={label} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground/70">{label}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground">{valor}</span>
            <button
              type="button"
              onClick={() => copiar(valor, label)}
              aria-label={`Copiar ${label}`}
              className="text-foreground/50 hover:text-foreground"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      ))}
      <p className="text-xs text-foreground/60">
        Hacé la transferencia o el depósito con estos datos y mandanos el comprobante por WhatsApp para
        confirmar tu pedido. Usá el número de pedido como referencia.
      </p>
    </div>
  )
}
