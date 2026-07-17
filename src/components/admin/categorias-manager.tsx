'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, Loader2, Save } from 'lucide-react'
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
import type { Categoria } from '@/types/db'
import { renombrarCategoria, reordenarCategorias } from '@/app/admin/productos/actions'

// Nombre y orden de las categorías reales del catálogo (Kits y cajas
// literarias, Marcapáginas, etc.) — el slug queda fijo, ver comentario en
// renombrarCategoria(). Mismo patrón de UI que NavLinksEditor.
export function CategoriasManager({ categoriasIniciales }: { categoriasIniciales: Categoria[] }) {
  const [items, setItems] = useState<Categoria[]>(categoriasIniciales)
  const [nombres, setNombres] = useState<Record<string, string>>(
    Object.fromEntries(categoriasIniciales.map((c) => [c.id, c.nombre])),
  )
  const [guardando, setGuardando] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const huboCambios =
    items.some((c, i) => c.id !== categoriasIniciales[i]?.id) ||
    items.some((c) => nombres[c.id]?.trim() !== c.nombre)

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

    const renombres = items.filter((c) => nombres[c.id]?.trim() && nombres[c.id].trim() !== c.nombre)
    for (const c of renombres) {
      const r = await renombrarCategoria(c.id, nombres[c.id])
      if (!r.ok) {
        setGuardando(false)
        toast.error(r.error)
        return
      }
    }

    const ordenCambio = items.some((c, i) => c.id !== categoriasIniciales[i]?.id)
    if (ordenCambio) {
      const r = await reordenarCategorias(items.map((c) => c.id))
      if (!r.ok) {
        setGuardando(false)
        toast.error(r.error)
        return
      }
    }

    setGuardando(false)
    toast.success('Categorías guardadas')
  }

  return (
    <div className="space-y-3 rounded-lg border p-5">
      <div>
        <h2 className="text-sm font-semibold">Categorías del catálogo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Arrastrá para reordenar y editá el nombre — así aparecen en el catálogo, el menú del header y las
          cards de categoría. Para crear una nueva, escribila al elegir categoría en la ficha de un producto.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Todavía no hay categorías cargadas.
        </p>
      ) : (
        <DndContext id="categorias" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((c) => (
                <FilaCategoria
                  key={c.id}
                  categoria={c}
                  nombre={nombres[c.id] ?? c.nombre}
                  onNombreChange={(v) => setNombres((prev) => ({ ...prev, [c.id]: v }))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Button type="button" onClick={guardar} disabled={guardando || !huboCambios}>
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar
      </Button>
    </div>
  )
}

function FilaCategoria({
  categoria,
  nombre,
  onNombreChange,
}: {
  categoria: Categoria
  nombre: string
  onNombreChange: (v: string) => void
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: categoria.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-background p-3 ${isDragging ? 'opacity-40' : ''}`}
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
      <Input
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        className="h-9 flex-1"
        aria-label={`Nombre de la categoría ${categoria.nombre}`}
      />
      <span className="shrink-0 text-xs text-muted-foreground">/{categoria.slug}</span>
    </div>
  )
}
