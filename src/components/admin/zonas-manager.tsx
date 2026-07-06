'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ZonaEnvio } from '@/types/db'
import { crearZona, actualizarZona, borrarZona } from '@/app/admin/zonas/actions'

export function ZonasManager({ zonasIniciales }: { zonasIniciales: ZonaEnvio[] }) {
  const [items, setItems] = useState<ZonaEnvio[]>(zonasIniciales)
  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState('')
  const [creando, setCreando] = useState(false)

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    const costoNum = Number(costo)
    if (!nombre.trim()) return toast.error('Ingresá un nombre.')
    if (!Number.isFinite(costoNum) || costoNum < 0) return toast.error('Ingresá un costo válido.')

    setCreando(true)
    const r = await crearZona(nombre, costoNum)
    setCreando(false)
    if (!r.ok) return toast.error(r.error)
    setItems((prev) => [...prev, r.zona])
    setNombre('')
    setCosto('')
    toast.success('Zona agregada')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="nombre-zona">Nombre</Label>
          <Input id="nombre-zona" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="costo-zona">Costo</Label>
          <Input
            id="costo-zona"
            type="number"
            inputMode="numeric"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            className="mt-1 w-28"
          />
        </div>
        <Button type="submit" disabled={creando}>
          {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay zonas cargadas.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((z) => (
            <FilaZona
              key={z.id}
              zona={z}
              onPatch={(id, patch) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
              onRemove={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilaZona({
  zona,
  onPatch,
  onRemove,
}: {
  zona: ZonaEnvio
  onPatch: (id: string, patch: Partial<ZonaEnvio>) => void
  onRemove: (id: string) => void
}) {
  const [nombre, setNombre] = useState(zona.nombre)
  const [costo, setCosto] = useState(String(zona.costo))
  const [guardando, setGuardando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)

  const cambiado = nombre !== zona.nombre || costo !== String(zona.costo)

  async function guardar() {
    setGuardando(true)
    const r = await actualizarZona(zona.id, { nombre: nombre.trim(), costo: Number(costo) })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    onPatch(zona.id, { nombre: nombre.trim(), costo: Number(costo) })
    toast.success('Guardado')
  }

  async function toggleActivo(val: boolean) {
    setTrabajando(true)
    const r = await actualizarZona(zona.id, { activo: val })
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    onPatch(zona.id, { activo: val })
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar la zona "${zona.nombre}"? No se puede deshacer.`)) return
    setTrabajando(true)
    const r = await borrarZona(zona.id)
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    onRemove(zona.id)
    toast.success('Zona borrada')
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
      <div className="min-w-[10rem] flex-1">
        <Label className="text-xs text-muted-foreground">Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 h-9" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Costo</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          className="mt-1 h-9 w-28"
        />
      </div>
      <Button type="button" onClick={guardar} disabled={!cambiado || guardando} className="h-9">
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
      </Button>
      <label className="flex h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={zona.activo}
          disabled={trabajando}
          onChange={(e) => toggleActivo(e.target.checked)}
          className="size-4"
        />
        Activa
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={borrar}
        disabled={trabajando}
        aria-label="Borrar zona"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
