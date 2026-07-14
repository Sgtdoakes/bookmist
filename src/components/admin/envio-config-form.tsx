'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { guardarEnvioConfig } from '@/app/admin/zonas/actions'
import type { EnvioConfig } from '@/lib/configuracion'

// Configuración general de envíos: umbral de envío gratis y punto de retiro.
// Vive junto a las zonas porque es todo "cómo llega el pedido".
export function EnvioConfigForm({ inicial }: { inicial: EnvioConfig }) {
  const [umbral, setUmbral] = useState(String(inicial.envioGratisUmbral || ''))
  const [retiroActivo, setRetiroActivo] = useState(inicial.retiroActivo)
  const [retiroEtiqueta, setRetiroEtiqueta] = useState(inicial.retiroEtiqueta)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    const r = await guardarEnvioConfig({
      envioGratisUmbral: Number(umbral) || 0,
      retiroActivo,
      retiroEtiqueta,
    })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Configuración de envíos guardada')
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <Label htmlFor="envio-gratis-umbral">Envío gratis a partir de ($)</Label>
        <Input
          id="envio-gratis-umbral"
          type="number"
          min={0}
          value={umbral}
          onChange={(e) => setUmbral(e.target.value)}
          placeholder="0 = sin envío gratis"
          className="mt-1 w-48"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Cuando el subtotal de productos llega a este monto, el envío a domicilio sale $0. Dejalo
          en 0 para desactivarlo.
        </p>
      </div>

      <div className="space-y-2 border-t pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={retiroActivo}
            onChange={(e) => setRetiroActivo(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Ofrecer retiro en persona (gratis)
        </label>
        {retiroActivo && (
          <div>
            <Label htmlFor="retiro-etiqueta">Cómo se muestra en el checkout</Label>
            <Input
              id="retiro-etiqueta"
              value={retiroEtiqueta}
              onChange={(e) => setRetiroEtiqueta(e.target.value)}
              className="mt-1"
            />
          </div>
        )}
      </div>

      <Button type="button" size="sm" onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar configuración'}
      </Button>
    </div>
  )
}
