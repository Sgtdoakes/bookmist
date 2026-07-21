'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CuponBienvenidaConfig } from '@/lib/configuracion'
import { guardarCuponBienvenida } from '@/app/admin/configuracion/actions'

// Cupón de bienvenida (Fase 8e): un único código general, igual para
// cualquiera que se suscriba desde el popup del sitio — no uno distinto por
// persona. Se manda por mail apenas alguien se suscribe.
export function CuponBienvenidaEditor({ cuponInicial }: { cuponInicial: CuponBienvenidaConfig }) {
  const [cupon, setCupon] = useState(cuponInicial)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    const r = await guardarCuponBienvenida(cupon)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Cupón guardado')
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Cupón de bienvenida</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quien se suscribe desde el popup del sitio recibe este código por mail. Se combina con el descuento
            por transferencia si paga de esa forma.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={cupon.activo}
            onChange={(e) => setCupon((c) => ({ ...c, activo: e.target.checked }))}
            className="size-4 accent-[var(--primary)]"
          />
          Activo
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="cupon-codigo">Código</Label>
          <Input
            id="cupon-codigo"
            value={cupon.codigo}
            onChange={(e) => setCupon((c) => ({ ...c, codigo: e.target.value.toUpperCase() }))}
            placeholder="BIENVENIDA10"
            className="mt-1 uppercase"
          />
        </div>
        <div>
          <Label htmlFor="cupon-pct">Porcentaje de descuento</Label>
          <Input
            id="cupon-pct"
            type="number"
            min={1}
            max={100}
            value={cupon.pct}
            onChange={(e) => setCupon((c) => ({ ...c, pct: Number(e.target.value) || 0 }))}
            className="mt-1"
          />
        </div>
      </div>

      <Button type="button" onClick={guardar} disabled={guardando}>
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar
      </Button>
    </div>
  )
}
