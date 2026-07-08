'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CuentaPago } from '@/lib/configuracion'
import { guardarCuentasPago } from '@/app/admin/configuracion/actions'

function cuentaVacia(): CuentaPago {
  return { id: crypto.randomUUID(), etiqueta: '', banco: '', alias: '', cbu: '', titular: '' }
}

export function CuentasPagoEditor({ cuentasIniciales }: { cuentasIniciales: CuentaPago[] }) {
  const [cuentas, setCuentas] = useState<CuentaPago[]>(cuentasIniciales)
  const [guardando, setGuardando] = useState(false)

  function agregar() {
    setCuentas((prev) => [...prev, cuentaVacia()])
  }

  function patch(id: string, cambio: Partial<CuentaPago>) {
    setCuentas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambio } : c)))
  }

  function quitar(id: string) {
    setCuentas((prev) => prev.filter((c) => c.id !== id))
  }

  async function guardar() {
    setGuardando(true)
    const r = await guardarCuentasPago(cuentas)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Datos de pago guardados')
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Cuentas para transferencia / depósito
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada cuenta necesita CBU o alias para aparecer en el checkout — así el cliente puede elegir la que le
          convenga y evitar comisiones entre bancos. Una cuenta sin CBU ni alias no se muestra.
        </p>
      </div>

      {cuentas.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay cuentas cargadas.
        </p>
      ) : (
        <div className="space-y-3">
          {cuentas.map((c) => (
            <FilaCuenta key={c.id} cuenta={c} onPatch={patch} onQuitar={quitar} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={agregar}>
          <Plus className="h-4 w-4" />
          Agregar cuenta
        </Button>
        <Button type="button" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>
    </div>
  )
}

function FilaCuenta({
  cuenta,
  onPatch,
  onQuitar,
}: {
  cuenta: CuentaPago
  onPatch: (id: string, cambio: Partial<CuentaPago>) => void
  onQuitar: (id: string) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Label htmlFor={`cuenta-etiqueta-${cuenta.id}`}>Nombre (para mostrar, ej: &quot;ICBC&quot;, &quot;Ualá&quot;)</Label>
          <Input
            id={`cuenta-etiqueta-${cuenta.id}`}
            value={cuenta.etiqueta}
            onChange={(e) => onPatch(cuenta.id, { etiqueta: e.target.value })}
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-5 h-9 w-9 shrink-0"
          onClick={() => onQuitar(cuenta.id)}
          aria-label="Quitar cuenta"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`cuenta-banco-${cuenta.id}`}>Banco / billetera</Label>
          <Input
            id={`cuenta-banco-${cuenta.id}`}
            value={cuenta.banco}
            onChange={(e) => onPatch(cuenta.id, { banco: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cuenta-titular-${cuenta.id}`}>Titular (opcional)</Label>
          <Input
            id={`cuenta-titular-${cuenta.id}`}
            value={cuenta.titular}
            onChange={(e) => onPatch(cuenta.id, { titular: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cuenta-cbu-${cuenta.id}`}>CBU / CVU</Label>
          <Input
            id={`cuenta-cbu-${cuenta.id}`}
            value={cuenta.cbu}
            onChange={(e) => onPatch(cuenta.id, { cbu: e.target.value })}
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label htmlFor={`cuenta-alias-${cuenta.id}`}>Alias</Label>
          <Input
            id={`cuenta-alias-${cuenta.id}`}
            value={cuenta.alias}
            onChange={(e) => onPatch(cuenta.id, { alias: e.target.value })}
            className="mt-1 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
