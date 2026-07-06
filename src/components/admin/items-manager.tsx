'use client'

import { useState } from 'react'
import { Loader2, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ItemCatalogo, ItemTipo } from '@/types/db'
import { crearItem, actualizarItem, borrarItem } from '@/app/admin/items/actions'

export function ItemsManager({ itemsIniciales }: { itemsIniciales: ItemCatalogo[] }) {
  const [items, setItems] = useState<ItemCatalogo[]>(itemsIniciales)
  const [tipo, setTipo] = useState<ItemTipo>('libro')
  const [nombre, setNombre] = useState('')
  const [autor, setAutor] = useState('')
  const [creando, setCreando] = useState(false)

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return toast.error('Ingresá un nombre.')
    setCreando(true)
    const r = await crearItem({ tipo, nombre, autor: tipo === 'libro' ? autor : null })
    setCreando(false)
    if (!r.ok) return toast.error(r.error)
    setItems((prev) => [...prev, r.item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
    setNombre('')
    setAutor('')
    toast.success('Ítem agregado')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div>
          <Label htmlFor="tipo-nuevo">Tipo</Label>
          <select
            id="tipo-nuevo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ItemTipo)}
            className="mt-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="libro">Libro</option>
            <option value="accesorio">Accesorio</option>
          </select>
        </div>
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="nombre-nuevo">Nombre</Label>
          <Input id="nombre-nuevo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1" />
        </div>
        {tipo === 'libro' && (
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="autor-nuevo">Autor</Label>
            <Input id="autor-nuevo" value={autor} onChange={(e) => setAutor(e.target.value)} className="mt-1" />
          </div>
        )}
        <Button type="submit" disabled={creando}>
          {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay ítems cargados.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <FilaItem
              key={item.id}
              item={item}
              onPatch={(id, patch) =>
                setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
              }
              onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilaItem({
  item,
  onPatch,
  onRemove,
}: {
  item: ItemCatalogo
  onPatch: (id: string, patch: Partial<ItemCatalogo>) => void
  onRemove: (id: string) => void
}) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(item.nombre)
  const [autor, setAutor] = useState(item.autor ?? '')
  const [descripcion, setDescripcion] = useState(item.descripcion ?? '')
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState(false)

  async function guardar() {
    setGuardando(true)
    const r = await actualizarItem(item.id, {
      nombre: nombre.trim(),
      autor: autor.trim() || null,
      descripcion: descripcion.trim() || null,
    })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    onPatch(item.id, { nombre: nombre.trim(), autor: autor.trim() || null, descripcion: descripcion.trim() || null })
    setEditando(false)
    toast.success('Guardado')
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${item.nombre}"? No se puede deshacer.`)) return
    setBorrando(true)
    const r = await borrarItem(item.id)
    setBorrando(false)
    if (!r.ok) return toast.error(r.error)
    onRemove(item.id)
    toast.success('Ítem borrado')
  }

  if (editando) {
    return (
      <div className="space-y-2 rounded-lg border p-3">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
        {item.tipo === 'libro' && (
          <Input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Autor" />
        )}
        <Input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-card-foreground">
        {item.tipo}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.nombre}</p>
        {item.autor && <p className="truncate text-sm text-muted-foreground">{item.autor}</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => setEditando(true)}
        aria-label="Editar ítem"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={borrar}
        disabled={borrando}
        aria-label="Borrar ítem"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
