'use client'

import { useState } from 'react'
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
import { ChevronDown, GripVertical, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SeccionInspector } from '@/components/admin/seccion-inspector'
import type { SeccionAdmin } from '@/lib/secciones'
import { guardarOrden, toggleActivoSeccion } from '@/app/admin/pagina/actions'

const TIPO_LABEL: Record<string, string> = {
  hero: 'Portada (hero)',
  beneficios: 'Barra de beneficios',
  categorias: 'Categorías',
  mas_vendidos: 'Más vendidos',
  sobre_mi: 'Sobre mí',
  resenas: 'Reseñas',
  instagram: 'Instagram',
}

export function SeccionesManager({ seccionesIniciales }: { seccionesIniciales: SeccionAdmin[] }) {
  const [items, setItems] = useState<SeccionAdmin[]>(seccionesIniciales)
  const [baseline, setBaseline] = useState<string[]>(seccionesIniciales.map((s) => s.id))
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  const [guardandoOrden, setGuardandoOrden] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const dirty = items.map((i) => i.id).join(',') !== baseline.join(',')

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const from = prev.findIndex((x) => x.id === active.id)
      const to = prev.findIndex((x) => x.id === over.id)
      if (from < 0 || to < 0) return prev
      return arrayMove(prev, from, to)
    })
  }

  async function guardarOrdenClick() {
    setGuardandoOrden(true)
    const r = await guardarOrden(items.map((i) => i.id))
    setGuardandoOrden(false)
    if (!r.ok) {
      toast.error(r.error)
      return
    }
    setBaseline(items.map((i) => i.id))
    toast.success('Orden guardado')
  }

  async function toggle(id: string, activo: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, activo } : i)))
    const r = await toggleActivoSeccion(id, activo)
    if (!r.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, activo: !activo } : i)))
      toast.error(r.error)
    }
  }

  function onGuardadoConfig(id: string, config: Record<string, unknown>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, config } : i)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {dirty ? 'Orden sin guardar' : 'Orden guardado'}
        </p>
        <Button type="button" size="sm" onClick={guardarOrdenClick} disabled={!dirty || guardandoOrden}>
          <Save className="h-4 w-4" />
          {guardandoOrden ? 'Guardando…' : 'Guardar orden'}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((s) => (
              <FilaSeccion
                key={s.id}
                seccion={s}
                expandido={expandidoId === s.id}
                onToggleExpandir={() => setExpandidoId(expandidoId === s.id ? null : s.id)}
                onToggleActivo={(v) => toggle(s.id, v)}
                onGuardadoConfig={(config) => onGuardadoConfig(s.id, config)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function FilaSeccion({
  seccion,
  expandido,
  onToggleExpandir,
  onToggleActivo,
  onGuardadoConfig,
}: {
  seccion: SeccionAdmin
  expandido: boolean
  onToggleExpandir: () => void
  onToggleActivo: (activo: boolean) => void
  onGuardadoConfig: (config: Record<string, unknown>) => void
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: seccion.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-background ${isDragging ? 'opacity-40' : ''} ${
        !seccion.activo ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          className="flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 font-medium">{TIPO_LABEL[seccion.tipo] ?? seccion.tipo}</span>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={seccion.activo}
            onChange={(e) => onToggleActivo(e.target.checked)}
            className="size-4"
          />
          Visible
        </label>
        <Button type="button" size="sm" variant="ghost" onClick={onToggleExpandir}>
          Editar
          <ChevronDown className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      {expandido && (
        <div className="border-t p-4">
          <SeccionInspector seccion={seccion} onGuardado={onGuardadoConfig} />
        </div>
      )}
    </div>
  )
}
