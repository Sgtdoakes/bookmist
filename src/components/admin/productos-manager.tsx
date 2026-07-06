'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/format'
import type { Producto } from '@/types/db'
import { actualizarProducto, borrarProducto } from '@/app/admin/productos/actions'

export function ProductosManager({ productosIniciales }: { productosIniciales: Producto[] }) {
  const [items, setItems] = useState<Producto[]>(productosIniciales)

  function patch(id: string, cambio: Partial<Producto>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambio } : p)))
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Todavía no hay productos cargados.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((p) => (
        <FilaProducto
          key={p.id}
          producto={p}
          onPatch={patch}
          onRemove={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  )
}

function FilaProducto({
  producto: p,
  onPatch,
  onRemove,
}: {
  producto: Producto
  onPatch: (id: string, patch: Partial<Producto>) => void
  onRemove: (id: string) => void
}) {
  const [precio, setPrecio] = useState(String(p.precio))
  const [stock, setStock] = useState(String(p.stock))
  const [guardando, setGuardando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)

  const cambiado = precio !== String(p.precio) || stock !== String(p.stock)

  async function guardar() {
    const patchLocal = { precio: Number(precio), stock: Number(stock) }
    setGuardando(true)
    const r = await actualizarProducto(p.id, patchLocal)
    setGuardando(false)
    if (r.ok) {
      onPatch(p.id, patchLocal)
      toast.success('Guardado', { description: p.nombre })
    } else {
      toast.error(r.error)
    }
  }

  async function toggle(field: 'activo' | 'destacado', val: boolean) {
    setTrabajando(true)
    const patchLocal = field === 'activo' ? { activo: val } : { destacado: val }
    const r = await actualizarProducto(p.id, patchLocal)
    setTrabajando(false)
    if (r.ok) onPatch(p.id, patchLocal)
    else toast.error(r.error)
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${p.nombre}"? No se puede deshacer.`)) return
    setTrabajando(true)
    const r = await borrarProducto(p.id)
    setTrabajando(false)
    if (r.ok) {
      onRemove(p.id)
      toast.success('Producto borrado')
    } else {
      toast.error(r.error)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{p.nombre}</p>
        <p className="truncate text-sm text-muted-foreground">
          {p.tipo === 'caja' ? 'Caja' : 'Kit'}
          {p.categoria ? ` · ${p.categoria}` : ''} · {formatARS(p.precio)}
        </p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Precio</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="h-9 w-28"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Stock</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="h-9 w-20"
        />
      </div>

      <Button type="button" onClick={guardar} disabled={!cambiado || guardando} className="h-9">
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
      </Button>

      <div className="flex h-9 items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={p.activo}
            disabled={trabajando}
            onChange={(e) => toggle('activo', e.target.checked)}
            className="size-4"
          />
          Visible
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={p.destacado}
            disabled={trabajando}
            onChange={(e) => toggle('destacado', e.target.checked)}
            className="size-4"
          />
          Destacado
        </label>
      </div>

      <Link
        href={`/admin/productos/${p.id}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-foreground/10"
        aria-label="Editar producto"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={borrar}
        disabled={trabajando}
        aria-label="Borrar producto"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
