'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { NavLink } from '@/types/db'
import { guardarNavLinks, type NavLinkItem } from '@/app/admin/configuracion/actions'

function aItems(links: NavLink[]): NavLinkItem[] {
  return links.map((l) => ({ id: l.id, label: l.label, href: l.href, activo: l.activo }))
}

export function NavLinksEditor({ linksIniciales }: { linksIniciales: NavLink[] }) {
  const [items, setItems] = useState<NavLinkItem[]>(aItems(linksIniciales))
  const [guardando, setGuardando] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function agregar() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: 'Nuevo link', href: '#', activo: true }])
  }

  function patch(id: string, cambio: Partial<NavLinkItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambio } : it)))
  }

  function quitar(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const from = prev.findIndex((it) => it.id === active.id)
      const to = prev.findIndex((it) => it.id === over.id)
      if (from === -1 || to === -1) return prev
      return arrayMove(prev, from, to)
    })
  }

  async function guardar() {
    setGuardando(true)
    const r = await guardarNavLinks(items)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Navegación guardada')
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <p className="text-xs text-muted-foreground">
        Arrastrá para reordenar · desmarcá para ocultar sin borrar · estos links se muestran en el header y el
        footer del sitio.
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay links cargados.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((it) => (
                <FilaNavLink key={it.id} item={it} onPatch={patch} onQuitar={quitar} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={agregar}>
          <Plus className="h-4 w-4" />
          Agregar link
        </Button>
        <Button type="button" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>
    </div>
  )
}

function FilaNavLink({
  item,
  onPatch,
  onQuitar,
}: {
  item: NavLinkItem
  onPatch: (id: string, cambio: Partial<NavLinkItem>) => void
  onQuitar: (id: string) => void
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-end gap-3 rounded-lg border bg-background p-3 ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        type="button"
        aria-label="Arrastrar para reordenar"
        className="inline-flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-[8rem] flex-1">
        <Input
          value={item.label}
          onChange={(e) => onPatch(item.id, { label: e.target.value })}
          className="h-9"
          aria-label="Texto del link"
        />
      </div>
      <div className="min-w-[8rem] flex-1">
        <Input
          value={item.href}
          onChange={(e) => onPatch(item.id, { href: e.target.value })}
          className="h-9"
          aria-label="Destino del link"
        />
      </div>
      <label className="flex h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={item.activo}
          onChange={(e) => onPatch(item.id, { activo: e.target.checked })}
          className="size-4"
        />
        Visible
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => onQuitar(item.id)}
        aria-label="Quitar link"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
