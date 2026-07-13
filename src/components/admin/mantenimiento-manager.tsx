'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { activarManual, desactivarManual } from '@/app/admin/mantenimiento/actions'
import type { Entorno } from '@/lib/mantenimiento'

type Estado = {
  activo: boolean
  motivo: string | null
  mensaje: string
  totalActivos: number
  conStock: number
}

// Un manager por ambiente (producción / pruebas) — cada uno con su propio
// toggle, mensaje y estado, sin compartir nada entre sí salvo las stats de
// stock (que son del catálogo real, no del ambiente).
export function MantenimientoManager({
  entorno,
  estadoInicial,
  mostrarStock = true,
}: {
  entorno: Entorno
  estadoInicial: Estado
  mostrarStock?: boolean
}) {
  const [estado, setEstado] = useState(estadoInicial)
  const [mensaje, setMensaje] = useState(estadoInicial.mensaje)
  const [trabajando, setTrabajando] = useState(false)

  async function activar() {
    setTrabajando(true)
    const r = await activarManual(entorno, mensaje)
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    setEstado((prev) => ({ ...prev, activo: true, motivo: 'manual' }))
    toast.success('Modo reponiendo stock activado')
  }

  async function desactivar() {
    setTrabajando(true)
    const r = await desactivarManual(entorno)
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    setEstado((prev) => ({ ...prev, activo: false, motivo: null }))
    toast.success('Sitio reactivado')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        {mostrarStock && (
          <p className="text-sm text-muted-foreground">
            {estado.totalActivos === 0
              ? 'Todavía no hay cajas/kits visibles cargados.'
              : `${estado.conStock} de ${estado.totalActivos} cajas/kits visibles tienen stock.`}
          </p>
        )}
        <p className="mt-2 flex items-center gap-2 font-medium">
          Estado actual:{' '}
          {estado.activo ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-sm text-amber-600">
              Activo {estado.motivo === 'auto_sin_stock' ? '(automático, sin stock)' : '(manual)'}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-sm text-emerald-600">
              Apagado — sitio funcionando normal
            </span>
          )}
        </p>
      </div>

      <div>
        <label htmlFor="mensaje-mantenimiento" className="text-sm font-medium">
          Mensaje que ven las visitas
        </label>
        <Textarea
          id="mensaje-mantenimiento"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Estamos reponiendo stock. Volvemos en unas horas…"
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        {estado.activo ? (
          <Button type="button" onClick={desactivar} disabled={trabajando}>
            {trabajando ? 'Reactivando…' : 'Reactivar sitio'}
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={activar} disabled={trabajando}>
            {trabajando ? 'Activando…' : 'Activar modo reponiendo stock'}
          </Button>
        )}
      </div>
    </div>
  )
}
