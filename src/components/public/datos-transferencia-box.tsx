'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { CuentaPago } from '@/lib/configuracion'

function copiar(valor: string, etiqueta: string) {
  if (!valor) return
  navigator.clipboard
    .writeText(valor)
    .then(() => toast.success(`${etiqueta} copiado`))
    .catch(() => toast.error('No se pudo copiar'))
}

function FilaDato({ label, valor }: { label: string; valor: string }) {
  if (!valor) return null
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
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
  )
}

// Datos reales para cerrar el pago ahí mismo (checkout y confirmación de
// pedido) — varias cuentas para que el cliente elija la que le convenga y
// evite comisiones entre bancos.
export function DatosTransferenciaBox({ cuentas }: { cuentas: CuentaPago[] }) {
  if (cuentas.length === 0) return null

  return (
    <div className="mt-3 space-y-3 text-left">
      {cuentas.map((c) => (
        <div key={c.id} className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          {c.etiqueta && <p className="text-sm font-semibold text-foreground">{c.etiqueta}</p>}
          <FilaDato label="Titular" valor={c.titular} />
          <FilaDato label="Banco" valor={c.banco} />
          <FilaDato label="CBU" valor={c.cbu} />
          <FilaDato label="Alias" valor={c.alias} />
        </div>
      ))}
      <p className="text-xs text-foreground/60">
        Hacé la transferencia o el depósito a la cuenta que más te convenga y mandanos el comprobante por
        WhatsApp para confirmar tu pedido. Usá el número de pedido como referencia.
      </p>
    </div>
  )
}
