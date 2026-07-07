'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  AlignLeft,
  GalleryHorizontalEnd,
  GripVertical,
  ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CartProvider } from '@/lib/cart'
import { Hero } from '@/components/public/hero'
import { BenefitsBar } from '@/components/public/benefits-bar'
import { CategoryGrid } from '@/components/public/category-grid'
import { BestSellersView } from '@/components/public/best-sellers'
import { AboutMe } from '@/components/public/about-me'
import { Reviews } from '@/components/public/reviews'
import { InstagramFeed } from '@/components/public/instagram-feed'
import { TextoBloque } from '@/components/public/texto-bloque'
import { ProductosBloqueView } from '@/components/public/productos-bloque'
import { BannerBloque } from '@/components/public/banner-bloque'
import { LibreBloque } from '@/components/public/libre-bloque'
import { BuilderInspector, TIPO_LABEL } from '@/components/admin/builder-inspector'
import { guardarLayout, previewSecciones, crearPagina, eliminarPagina } from '@/app/admin/pagina/actions'
import {
  resolverSeccion,
  TIPOS_BLOQUE_LIBRE,
  type ElementoLibre,
  type SeccionAdmin,
  type SeccionPreview,
  type SeccionTipo,
} from '@/lib/secciones'
import type { PaginaRow, Producto } from '@/types/db'

// Un bloque del borrador del editor. `id` puede ser un uuid real (existe en
// la base) o uno temporal generado al agregar/duplicar (se inserta al guardar).
type Bloque = { id: string; tipo: SeccionTipo; activo: boolean; config: Record<string, unknown> }

function aBloques(secciones: SeccionAdmin[]): Bloque[] {
  return secciones.map((s) => ({ id: s.id, tipo: s.tipo as SeccionTipo, activo: s.activo, config: s.config ?? {} }))
}
function indexarPreview(secciones: SeccionPreview[]): Record<string, SeccionPreview> {
  return Object.fromEntries(secciones.map((s) => [s.id, s]))
}

const RAIL_ITEMS: { tipo: SeccionTipo; icon: React.ElementType; label: string }[] = [
  { tipo: 'texto', icon: AlignLeft, label: 'Texto' },
  { tipo: 'productos', icon: GalleryHorizontalEnd, label: 'Productos' },
  { tipo: 'banner', icon: ImageIcon, label: 'Banner' },
  { tipo: 'libre', icon: LayoutGrid, label: 'Libre' },
]

// Render de una sección con los MISMOS componentes que el sitio público.
function SeccionView({ s }: { s: SeccionPreview }) {
  switch (s.tipo) {
    case 'hero':
      return <Hero {...s.config} />
    case 'beneficios':
      return <BenefitsBar {...s.config} />
    case 'categorias':
      return <CategoryGrid {...s.config} />
    case 'mas_vendidos':
      return (
        <BestSellersView
          eyebrow={s.config.eyebrow}
          titulo={s.config.titulo}
          productos={s.productosResueltos ?? []}
          estilo={s.config.estilo}
        />
      )
    case 'sobre_mi':
      return <AboutMe {...s.config} />
    case 'resenas':
      return <Reviews {...s.config} />
    case 'instagram':
      return <InstagramFeed {...s.config} />
    case 'texto':
      return <TextoBloque {...s.config} />
    case 'productos':
      return (
        <ProductosBloqueView
          eyebrow={s.config.eyebrow}
          titulo={s.config.titulo}
          productos={s.productosResueltos ?? []}
          estilo={s.config.estilo}
        />
      )
    case 'banner':
      return <BannerBloque {...s.config} />
    case 'libre':
      return <LibreBloque {...s.config} />
  }
}

export function PageBuilder({
  pagina,
  paginas,
  inicial,
  previewInicial,
  productosDisponibles,
}: {
  pagina: string
  paginas: PaginaRow[]
  inicial: SeccionAdmin[]
  previewInicial: SeccionPreview[]
  productosDisponibles: Producto[]
}) {
  const router = useRouter()
  const [bloques, setBloques] = useState<Bloque[]>(() => aBloques(inicial))
  const [preview, setPreview] = useState<Record<string, SeccionPreview>>(() => indexarPreview(previewInicial))
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(aBloques(inicial)))
  const [selId, setSelId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [creandoPagina, setCreandoPagina] = useState(false)
  const [vista, setVista] = useState<'desktop' | 'movil'>('desktop')
  const paginaActual = paginas.find((p) => p.slug === pagina) ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const tipo = active.data.current?.type

    if (tipo === 'chip-producto') {
      const seccionId = String(active.data.current?.seccionId ?? '')
      const fromId = String(active.data.current?.productoId ?? '')
      const toId = String(over.data.current?.productoId ?? '')
      if (seccionId && fromId && toId) reordenarProductos(seccionId, fromId, toId)
      return
    }
    if (tipo === 'chip-elemento') {
      const seccionId = String(active.data.current?.seccionId ?? '')
      const fromId = String(active.data.current?.elementoId ?? '')
      const toId = String(over.data.current?.elementoId ?? '')
      if (seccionId && fromId && toId) reordenarElementos(seccionId, fromId, toId)
      return
    }

    setBloques((bs) => {
      const from = bs.findIndex((b) => b.id === active.id)
      const to = bs.findIndex((b) => b.id === over.id)
      if (from < 0 || to < 0) return bs
      return arrayMove(bs, from, to)
    })
  }

  function reordenarProductos(seccionId: string, fromId: string, toId: string) {
    setBloques((bs) =>
      bs.map((b) => {
        if (b.id !== seccionId) return b
        const ids = (b.config.productos as string[]) ?? []
        const from = ids.indexOf(fromId)
        const to = ids.indexOf(toId)
        if (from < 0 || to < 0) return b
        return { ...b, config: { ...b.config, productos: arrayMove(ids, from, to) } }
      }),
    )
    setPreview((p) => {
      const s = p[seccionId]
      if (!s || s.tipo !== 'productos' || !s.productosResueltos) return p
      const from = s.productosResueltos.findIndex((x) => x.id === fromId)
      const to = s.productosResueltos.findIndex((x) => x.id === toId)
      if (from < 0 || to < 0) return p
      return { ...p, [seccionId]: { ...s, productosResueltos: arrayMove(s.productosResueltos, from, to) } }
    })
  }

  function quitarProducto(seccionId: string, productoId: string) {
    setBloques((bs) =>
      bs.map((b) =>
        b.id === seccionId
          ? { ...b, config: { ...b.config, productos: ((b.config.productos as string[]) ?? []).filter((x) => x !== productoId) } }
          : b,
      ),
    )
    setPreview((p) => {
      const s = p[seccionId]
      if (!s || s.tipo !== 'productos' || !s.productosResueltos) return p
      return { ...p, [seccionId]: { ...s, productosResueltos: s.productosResueltos.filter((x) => x.id !== productoId) } }
    })
  }

  function reordenarElementos(seccionId: string, fromId: string, toId: string) {
    setBloques((bs) =>
      bs.map((b) => {
        if (b.id !== seccionId || b.tipo !== 'libre') return b
        const elementos = (b.config.elementos as ElementoLibre[]) ?? []
        const from = elementos.findIndex((x) => x.id === fromId)
        const to = elementos.findIndex((x) => x.id === toId)
        if (from < 0 || to < 0) return b
        return { ...b, config: { ...b.config, elementos: arrayMove(elementos, from, to) } }
      }),
    )
    setPreview((p) => {
      const s = p[seccionId]
      if (!s || s.tipo !== 'libre') return p
      const elementos = s.config.elementos
      const from = elementos.findIndex((x) => x.id === fromId)
      const to = elementos.findIndex((x) => x.id === toId)
      if (from < 0 || to < 0) return p
      return { ...p, [seccionId]: { ...s, config: { ...s.config, elementos: arrayMove(elementos, from, to) } } }
    })
  }

  function quitarElemento(seccionId: string, elementoId: string) {
    setBloques((bs) =>
      bs.map((b) =>
        b.id === seccionId
          ? { ...b, config: { ...b.config, elementos: ((b.config.elementos as ElementoLibre[]) ?? []).filter((x) => x.id !== elementoId) } }
          : b,
      ),
    )
    setPreview((p) => {
      const s = p[seccionId]
      if (!s || s.tipo !== 'libre') return p
      return { ...p, [seccionId]: { ...s, config: { ...s.config, elementos: s.config.elementos.filter((x) => x.id !== elementoId) } } }
    })
  }

  const bloquesRef = useRef(bloques)
  useEffect(() => {
    bloquesRef.current = bloques
  }, [bloques])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => clearTimeout(id))
  }, [])

  const dirty = useMemo(() => JSON.stringify(bloques) !== baseline, [bloques, baseline])
  const selBloque = bloques.find((b) => b.id === selId) ?? null

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelId(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  function programarResolver(id: string) {
    const prev = timers.current.get(id)
    if (prev) clearTimeout(prev)
    timers.current.set(
      id,
      setTimeout(async () => {
        timers.current.delete(id)
        const b = bloquesRef.current.find((x) => x.id === id)
        if (!b) return
        const [pv] = await previewSecciones([{ id: b.id, tipo: b.tipo, config: b.config }])
        if (pv) setPreview((p) => ({ ...p, [id]: pv }))
      }, 350),
    )
  }

  // reResolve=true cuando el cambio altera qué productos se muestran
  // (fuente/categoría/selección manual); si no, parchea el preview al instante.
  function editar(id: string, partial: Record<string, unknown>, reResolve: boolean) {
    setBloques((bs) => bs.map((b) => (b.id === id ? { ...b, config: { ...b.config, ...partial } } : b)))
    if (reResolve) {
      programarResolver(id)
    } else {
      setPreview((p) => {
        const s = p[id]
        if (!s) return p
        return { ...p, [id]: { ...s, config: { ...s.config, ...partial } } as SeccionPreview }
      })
    }
  }

  function scrollAlBloque(id: string) {
    setTimeout(() => {
      document.querySelector(`[data-bloque-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  async function agregar(tipo: SeccionTipo) {
    const id = crypto.randomUUID()
    const config = resolverSeccion(tipo, {}).config as Record<string, unknown>
    setBloques((bs) => [...bs, { id, tipo, activo: true, config }])
    setSelId(id)
    scrollAlBloque(id)
    const [pv] = await previewSecciones([{ id, tipo, config }])
    if (pv) setPreview((p) => ({ ...p, [id]: pv }))
  }

  function mover(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= bloques.length) return
    const next = [...bloques]
    ;[next[i], next[j]] = [next[j], next[i]]
    setBloques(next)
  }

  function toggle(id: string) {
    setBloques((bs) => bs.map((b) => (b.id === id ? { ...b, activo: !b.activo } : b)))
  }

  function duplicar(i: number) {
    const orig = bloques[i]
    const nuevoId = crypto.randomUUID()
    const copia: Bloque = { ...orig, id: nuevoId, config: { ...orig.config } }
    setBloques((bs) => [...bs.slice(0, i + 1), copia, ...bs.slice(i + 1)])
    const pv = preview[orig.id]
    if (pv) setPreview((p) => ({ ...p, [nuevoId]: { ...pv, id: nuevoId } }))
    setSelId(nuevoId)
    scrollAlBloque(nuevoId)
  }

  function borrar(id: string) {
    setBloques((bs) => bs.filter((b) => b.id !== id))
    if (selId === id) setSelId(null)
  }

  async function guardar() {
    setGuardando(true)
    const r = await guardarLayout(
      pagina,
      bloques.map((b) => ({ id: b.id, tipo: b.tipo, activo: b.activo, config: b.config })),
    )
    if (!r.ok) {
      setGuardando(false)
      toast.error(r.error)
      return
    }
    const frescos = aBloques(r.secciones)
    const pv = await previewSecciones(r.secciones.map((s) => ({ id: s.id, tipo: s.tipo, config: s.config })))
    setBloques(frescos)
    setPreview(indexarPreview(pv))
    setBaseline(JSON.stringify(frescos))
    setSelId(null)
    setGuardando(false)
    toast.success('Cambios guardados')
    router.refresh()
  }

  async function descartar() {
    if (dirty && !window.confirm('Vas a perder los cambios sin guardar. ¿Descartar?')) return
    const base = JSON.parse(baseline) as Bloque[]
    setBloques(base)
    setSelId(null)
    // El preview (con productos ya resueltos) también queda "sucio" tras
    // editar — sin este re-fetch, el lienzo seguiría mostrando el cambio
    // descartado aunque el borrador ya haya vuelto atrás.
    const pv = await previewSecciones(base.map((b) => ({ id: b.id, tipo: b.tipo, config: b.config })))
    setPreview(indexarPreview(pv))
  }

  async function nuevaPagina() {
    if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Crear una página nueva igual?')) return
    const titulo = window.prompt('Título de la página nueva (ej: Contacto):')
    if (!titulo?.trim()) return
    setCreandoPagina(true)
    const r = await crearPagina(titulo)
    setCreandoPagina(false)
    if (!r.ok) return toast.error(r.error)
    toast.success('Página creada')
    router.push(`/admin/pagina?pagina=${r.pagina.slug}`)
    router.refresh()
  }

  async function borrarPaginaActual() {
    if (!paginaActual || paginaActual.sistema) return
    if (!window.confirm(`¿Borrar "${paginaActual.titulo}"? Se van a borrar todos sus bloques. No se puede deshacer.`)) {
      return
    }
    const r = await eliminarPagina(paginaActual.id)
    if (!r.ok) return toast.error(r.error)
    toast.success('Página borrada')
    router.push('/admin/pagina?pagina=home')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-2.5">
        <Link
          href="/admin"
          onClick={(e) => {
            if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Salir igual?')) e.preventDefault()
          }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Panel
        </Link>
        <div className="flex items-center gap-1.5">
          <LayoutTemplate className="h-5 w-5 shrink-0 text-primary" />
          {paginas.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => {
                if (p.slug === pagina) return
                if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Cambiar de página igual?')) return
                router.push(`/admin/pagina?pagina=${p.slug}`)
              }}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                p.slug === pagina ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {p.titulo}
            </button>
          ))}
          <button
            type="button"
            aria-label="Nueva página"
            title="Nueva página institucional"
            onClick={nuevaPagina}
            disabled={creandoPagina}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
          {paginaActual && !paginaActual.sistema && (
            <button
              type="button"
              aria-label="Borrar página"
              title="Borrar esta página"
              onClick={borrarPaginaActual}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {dirty ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Cambios sin guardar</span>
        ) : (
          <span className="text-xs text-muted-foreground">Todo guardado</span>
        )}

        <div className="ml-auto flex items-center rounded-lg border p-0.5">
          <button
            type="button"
            aria-label="Vista escritorio"
            title="Vista escritorio"
            onClick={() => setVista('desktop')}
            className={`inline-flex h-7 w-7 items-center justify-center rounded ${
              vista === 'desktop' ? 'bg-accent text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Vista móvil"
            title="Vista móvil (ancho aproximado)"
            onClick={() => setVista('movil')}
            className={`inline-flex h-7 w-7 items-center justify-center rounded ${
              vista === 'movil' ? 'bg-accent text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={descartar} disabled={!dirty || guardando}>
            <RotateCcw className="h-4 w-4" />
            Descartar
          </Button>
          <Button type="button" size="sm" onClick={guardar} disabled={!dirty || guardando}>
            <Save className="h-4 w-4" />
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Rail onAgregar={agregar} />

        <div className="flex-1 overflow-auto bg-muted/30 p-4 sm:p-6">
          <div
            className={`mx-auto rounded-xl border bg-background shadow-sm transition-[max-width] ${
              vista === 'movil' ? 'max-w-[420px]' : 'max-w-6xl'
            }`}
          >
            <CartProvider>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <div className="space-y-10 px-4 py-10">
                  {bloques.length === 0 && (
                    <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                      No hay bloques. Agregá uno desde la columna izquierda →
                    </div>
                  )}
                  <SortableContext items={bloques.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {bloques.map((b, i) => (
                      <BloqueCanvas
                        key={b.id}
                        bloque={b}
                        seccion={preview[b.id]}
                        esBloqueLibre={TIPOS_BLOQUE_LIBRE.includes(b.tipo)}
                        seleccionado={selId === b.id}
                        esPrimera={i === 0}
                        esUltima={i === bloques.length - 1}
                        onSeleccionar={() => setSelId(b.id)}
                        onSubir={() => mover(i, -1)}
                        onBajar={() => mover(i, 1)}
                        onToggle={() => toggle(b.id)}
                        onDuplicar={() => duplicar(i)}
                        onBorrar={() => borrar(b.id)}
                        onQuitarProducto={(pid) => quitarProducto(b.id, pid)}
                        onQuitarElemento={(eid) => quitarElemento(b.id, eid)}
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            </CartProvider>
          </div>
        </div>

        {selBloque && (
          <BuilderInspector
            key={selBloque.id}
            id={selBloque.id}
            tipo={selBloque.tipo}
            config={selBloque.config}
            productosDisponibles={productosDisponibles}
            onChange={(partial, reResolve) => editar(selBloque.id, partial, reResolve)}
            onClose={() => setSelId(null)}
          />
        )}
      </div>
    </div>
  )
}

function Rail({ onAgregar }: { onAgregar: (t: SeccionTipo) => void }) {
  return (
    <aside className="w-24 shrink-0 overflow-y-auto border-r bg-background p-2">
      <p className="px-1 pb-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">Bloques</p>
      <div className="space-y-2">
        {RAIL_ITEMS.map((it) => (
          <button
            key={it.tipo}
            type="button"
            onClick={() => onAgregar(it.tipo)}
            className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed p-2 text-muted-foreground transition hover:border-primary/50 hover:bg-accent hover:text-foreground"
          >
            <it.icon className="h-5 w-5" />
            <span className="text-center text-[10px] leading-tight">{it.label}</span>
          </button>
        ))}
      </div>
      <p className="px-1 pt-3 text-center text-[10px] text-muted-foreground">Tocá para agregar</p>
    </aside>
  )
}

function BloqueCanvas({
  bloque,
  seccion,
  esBloqueLibre,
  seleccionado,
  esPrimera,
  esUltima,
  onSeleccionar,
  onSubir,
  onBajar,
  onToggle,
  onDuplicar,
  onBorrar,
  onQuitarProducto,
  onQuitarElemento,
}: {
  bloque: Bloque
  seccion: SeccionPreview | undefined
  esBloqueLibre: boolean
  seleccionado: boolean
  esPrimera: boolean
  esUltima: boolean
  onSeleccionar: () => void
  onSubir: () => void
  onBajar: () => void
  onToggle: () => void
  onDuplicar: () => void
  onBorrar: () => void
  onQuitarProducto: (id: string) => void
  onQuitarElemento: (id: string) => void
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: bloque.id,
    data: { type: 'seccion' },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const productosEditables =
    seleccionado && bloque.tipo === 'productos' && bloque.config.fuente === 'manual' && seccion?.tipo === 'productos'
      ? (seccion.productosResueltos ?? [])
      : null
  const elementosEditables = seleccionado && bloque.tipo === 'libre' && seccion?.tipo === 'libre' ? seccion.config.elementos : null

  const placeholder = (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {TIPO_LABEL[bloque.tipo]} sin contenido todavía. Configurá su fuente en el panel de la derecha.
    </div>
  )

  let contenido: React.ReactNode
  if (productosEditables) {
    contenido = <ProductosEditables seccionId={bloque.id} productos={productosEditables} onQuitar={onQuitarProducto} />
  } else if (elementosEditables) {
    contenido = <ElementosEditables seccionId={bloque.id} elementos={elementosEditables} onQuitar={onQuitarElemento} />
  } else if (!seccion) {
    contenido = placeholder
  } else {
    let vacio = false
    if (seccion.tipo === 'productos' || seccion.tipo === 'mas_vendidos') vacio = (seccion.productosResueltos ?? []).length === 0
    else if (seccion.tipo === 'libre') vacio = seccion.config.elementos.length === 0
    else if (seccion.tipo === 'banner') vacio = !seccion.config.titulo && !seccion.config.imagen
    else if (seccion.tipo === 'texto') vacio = !seccion.config.titulo && !seccion.config.texto
    contenido = vacio ? placeholder : <SeccionView s={seccion} />
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      data-bloque-id={bloque.id}
      className={`group relative rounded-lg ring-offset-4 transition ${
        seleccionado ? 'ring-2 ring-primary' : 'ring-1 ring-transparent hover:ring-border'
      } ${!bloque.activo ? 'opacity-50' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      <div
        className="absolute -top-3 left-3 z-10 flex items-center gap-0.5 rounded-md border bg-background px-1 py-0.5 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100 data-[sel=true]:opacity-100"
        data-sel={seleccionado}
      >
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          className="inline-flex h-7 w-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="px-1 text-[11px] font-medium text-muted-foreground">{TIPO_LABEL[bloque.tipo]}</span>
        {!bloque.activo && <span className="px-1 text-[11px] text-amber-700">oculto</span>}
        <BotonBarra label="Subir" disabled={esPrimera} onClick={onSubir}>
          <ArrowUp className="h-3.5 w-3.5" />
        </BotonBarra>
        <BotonBarra label="Bajar" disabled={esUltima} onClick={onBajar}>
          <ArrowDown className="h-3.5 w-3.5" />
        </BotonBarra>
        <BotonBarra label={bloque.activo ? 'Ocultar' : 'Mostrar'} onClick={onToggle}>
          {bloque.activo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </BotonBarra>
        {esBloqueLibre && (
          <>
            <BotonBarra label="Duplicar" onClick={onDuplicar}>
              <Copy className="h-3.5 w-3.5" />
            </BotonBarra>
            <BotonBarra
              label="Eliminar"
              onClick={() => {
                if (window.confirm('¿Eliminar este bloque?')) onBorrar()
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </BotonBarra>
          </>
        )}
      </div>

      {productosEditables || elementosEditables ? (
        <div>{contenido}</div>
      ) : (
        <div
          onClickCapture={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSeleccionar()
          }}
          className="cursor-pointer"
        >
          {contenido}
        </div>
      )}
    </section>
  )
}

// Productos de un bloque manual en modo edición: fichas que se reordenan
// arrastrando (handle ⠿) y se quitan con la ✕.
function ProductosEditables({
  seccionId,
  productos,
  onQuitar,
}: {
  seccionId: string
  productos: Producto[]
  onQuitar: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Arrastrá las fichas para reordenar · tocá ✕ para quitar · agregá más productos desde el panel de la derecha.
      </p>
      {productos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía no hay productos. Elegilos desde el panel de la derecha.
        </p>
      ) : (
        <SortableContext items={productos.map((p) => `producto:${p.id}`)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {productos.map((p) => (
              <ChipProducto key={p.id} seccionId={seccionId} producto={p} onQuitar={onQuitar} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

function ChipProducto({ seccionId, producto, onQuitar }: { seccionId: string; producto: Producto; onQuitar: (id: string) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `producto:${producto.id}`,
    data: { type: 'chip-producto', productoId: producto.id, seccionId },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className={`relative w-28 shrink-0 ${isDragging ? 'opacity-40' : ''}`}>
      <button
        type="button"
        aria-label="Arrastrar para reordenar"
        className="absolute top-1 left-1 z-10 inline-flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded bg-background/85 text-muted-foreground shadow-sm active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Quitar producto"
        onClick={() => onQuitar(producto.id)}
        className="absolute top-1 right-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded bg-background/85 text-destructive shadow-sm hover:bg-background"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="relative h-28 w-28 overflow-hidden rounded-md border bg-muted/30">
        {producto.imagen_principal && <Image src={producto.imagen_principal} alt="" fill sizes="112px" className="object-cover" />}
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-tight">{producto.nombre}</p>
    </div>
  )
}

// Elementos de un bloque "Libre" en modo edición: mismo patrón de fichas
// arrastrables, en columna en vez de fila.
function ElementosEditables({
  seccionId,
  elementos,
  onQuitar,
}: {
  seccionId: string
  elementos: ElementoLibre[]
  onQuitar: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Arrastrá las piezas para reordenar · tocá ✕ para quitar · agregá más desde el panel de la derecha.
      </p>
      {elementos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía no hay piezas. Agregalas desde el panel de la derecha.
        </p>
      ) : (
        <SortableContext items={elementos.map((e) => `elemento:${e.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {elementos.map((el) => (
              <ChipElemento key={el.id} seccionId={seccionId} elemento={el} onQuitar={onQuitar} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

function ChipElemento({ seccionId, elemento, onQuitar }: { seccionId: string; elemento: ElementoLibre; onQuitar: (id: string) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `elemento:${elemento.id}`,
    data: { type: 'chip-elemento', elementoId: elemento.id, seccionId },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 rounded-lg border bg-background p-2 ${isDragging ? 'opacity-40' : ''}`}>
      <button
        type="button"
        aria-label="Arrastrar para reordenar"
        className="inline-flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <ElementoResumen elemento={elemento} />
      </div>
      <button
        type="button"
        aria-label="Quitar pieza"
        onClick={() => onQuitar(elemento.id)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-destructive hover:bg-destructive/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ElementoResumen({ elemento }: { elemento: ElementoLibre }) {
  switch (elemento.tipo) {
    case 'titulo':
      return <span className="font-heading text-base font-semibold">{elemento.texto || '(título vacío)'}</span>
    case 'parrafo':
      return <span className="line-clamp-2 text-sm opacity-80">{elemento.texto || '(párrafo vacío)'}</span>
    case 'imagen':
      return elemento.url ? (
        <span className="flex items-center gap-2">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
            <Image src={elemento.url} alt="" fill sizes="40px" className="object-cover" />
          </span>
          <span className="text-xs text-muted-foreground">Imagen</span>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Imagen (sin subir)</span>
      )
    case 'boton':
      return (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {elemento.texto || 'Botón'}
        </span>
      )
    case 'espacio':
      return <span className="text-xs text-muted-foreground">Espacio ({elemento.alto})</span>
  }
}

function BotonBarra({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
    >
      {children}
    </button>
  )
}
