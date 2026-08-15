'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, Loader2, Save, Trash2 } from 'lucide-react'
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
import {
  borrarCategoria,
  renombrarCategoria,
  reordenarCategorias,
  type CategoriaConUso,
} from '@/app/admin/productos/actions'

// "Destacados" es la única que no se puede borrar — mismo motivo que la
// filtra del menú del header (site-header.tsx): no es una temática más.
const SLUG_PROTEGIDO = 'destacados'

// Nombre, orden y borrado de las categorías reales del catálogo (Kits y
// cajas literarias, Marcapáginas, etc.) — el slug queda fijo, ver comentario
// en renombrarCategoria(). Mismo patrón de UI que NavLinksEditor.
export function CategoriasManager({ categoriasIniciales }: { categoriasIniciales: CategoriaConUso[] }) {
  const [items, setItems] = useState<CategoriaConUso[]>(categoriasIniciales)
  const [nombres, setNombres] = useState<Record<string, string>>(
    Object.fromEntries(categoriasIniciales.map((c) => [c.id, c.nombre])),
  )
  const [guardando, setGuardando] = useState(false)
  // Lo último que se sabe guardado en la base. Vive en estado (y no se lee de
  // la prop) porque un borrado o un guardado cambian la referencia sin que la
  // prop llegue todavía: comparar contra la prop dejaba el botón "Guardar"
  // encendido para siempre después del primer guardado.
  const [base, setBase] = useState<CategoriaConUso[]>(categoriasIniciales)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const huboCambios =
    items.length !== base.length ||
    items.some((c, i) => c.id !== base[i]?.id) ||
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

    const ordenCambio = items.length !== base.length || items.some((c, i) => c.id !== base[i]?.id)
    if (ordenCambio) {
      const r = await reordenarCategorias(items.map((c) => c.id))
      if (!r.ok) {
        setGuardando(false)
        toast.error(r.error)
        return
      }
    }

    const guardadas = items.map((c) => ({ ...c, nombre: nombres[c.id]?.trim() || c.nombre }))
    setItems(guardadas)
    setBase(guardadas)
    setGuardando(false)
    toast.success('Categorías guardadas')
  }

  // El borrado va solo (no espera al botón "Guardar"): es destructivo y no se
  // puede deshacer, así que conviene que sea un acto explícito y aislado.
  async function borrar(categoria: CategoriaConUso) {
    if (!window.confirm(mensajeDeBorrado(categoria))) return

    setGuardando(true)
    const r = await borrarCategoria(categoria.id)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)

    setItems((prev) => prev.filter((c) => c.id !== categoria.id))
    setBase((prev) => prev.filter((c) => c.id !== categoria.id))
    toast.success(`Categoría "${categoria.nombre}" borrada`)
  }

  return (
    <div className="space-y-3 rounded-lg border p-5">
      <div>
        <h2 className="text-sm font-semibold">Categorías del catálogo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Arrastrá para reordenar, editá el nombre o borrá la que no uses — así aparecen en el catálogo, el
          menú del header y las cards de categoría. Para crear una nueva, escribila al elegir categoría en la
          ficha de un producto. Borrar una categoría no borra sus productos: solo les saca esa etiqueta.
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
                  onBorrar={() => borrar(c)}
                  trabajando={guardando}
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

// Se avisa producto por producto y bloque por bloque porque son dos daños
// distintos: los productos solo pierden una etiqueta (recuperable a mano),
// pero un bloque que apuntaba a esta categoría se queda sin nada que mostrar
// y desaparece de su página sin ningún error visible.
function mensajeDeBorrado(c: CategoriaConUso): string {
  const consecuencias = [
    c.productos > 0 &&
      `${c.productos} producto${c.productos === 1 ? '' : 's'} dejaría${c.productos === 1 ? '' : 'n'} de tener esta categoría (no se borran).`,
    c.bloques > 0 &&
      `${c.bloques} bloque${c.bloques === 1 ? '' : 's'} de página apunta${c.bloques === 1 ? '' : 'n'} a esta categoría y quedaría${c.bloques === 1 ? '' : 'n'} vacío${c.bloques === 1 ? '' : 's'} — revisá esas páginas después.`,
  ].filter(Boolean)

  return [`¿Borrar la categoría "${c.nombre}"?`, ...consecuencias, 'No se puede deshacer.'].join('\n\n')
}

function FilaCategoria({
  categoria,
  nombre,
  onNombreChange,
  onBorrar,
  trabajando,
}: {
  categoria: CategoriaConUso
  nombre: string
  onNombreChange: (v: string) => void
  onBorrar: () => void
  trabajando: boolean
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: categoria.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const protegida = categoria.slug === SLUG_PROTEGIDO

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
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {categoria.productos} {categoria.productos === 1 ? 'producto' : 'productos'}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onBorrar}
        disabled={trabajando || protegida}
        aria-label={`Borrar la categoría ${categoria.nombre}`}
        title={
          protegida
            ? '"Destacados" no se puede borrar: de ella dependen el toggle de destacados y la vidriera de la home.'
            : `Borrar la categoría ${categoria.nombre}`
        }
      >
        <Trash2 className={`h-4 w-4 ${protegida ? '' : 'text-destructive'}`} />
      </Button>
    </div>
  )
}
