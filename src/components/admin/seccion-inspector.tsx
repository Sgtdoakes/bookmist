'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/admin/image-uploader'
import { EstiloEditor } from '@/components/admin/estilo-editor'
import { SelectorProductos } from '@/components/admin/selector-productos'
import { resolverSeccion, TIPOS_CONOCIDOS, type SeccionTipo, type ProductosFuente } from '@/lib/secciones'
import type { EstiloBloque } from '@/lib/estilo-secciones'
import { guardarConfigSeccion } from '@/app/admin/pagina/actions'
import type { SeccionAdmin } from '@/lib/secciones'
import type { Producto } from '@/types/db'

export function SeccionInspector({
  seccion,
  productosDisponibles,
  onGuardado,
}: {
  seccion: SeccionAdmin
  productosDisponibles: Producto[]
  onGuardado: (config: Record<string, unknown>) => void
}) {
  const [guardando, setGuardando] = useState(false)

  if (!esSeccionTipoConocido(seccion.tipo)) {
    return <p className="text-sm text-muted-foreground">Tipo de sección desconocido.</p>
  }

  const resuelta = resolverSeccion(seccion.tipo, seccion.config)

  async function guardar(config: Record<string, unknown>) {
    setGuardando(true)
    const r = await guardarConfigSeccion(seccion.id, config)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    onGuardado(config)
    toast.success('Contenido guardado')
  }

  switch (resuelta.tipo) {
    case 'hero':
      return <FormularioHero config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'beneficios':
      return <FormularioBeneficios config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'categorias':
      return <FormularioTitular config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'mas_vendidos':
      return <FormularioTitular config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'sobre_mi':
      return <FormularioSobreMi config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'resenas':
      return <FormularioResenas config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'instagram':
      return <FormularioInstagram config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'texto':
      return <FormularioTexto config={resuelta.config} guardando={guardando} onGuardar={guardar} />
    case 'productos':
      return (
        <FormularioProductos
          config={resuelta.config}
          productosDisponibles={productosDisponibles}
          guardando={guardando}
          onGuardar={guardar}
        />
      )
    case 'banner':
      return (
        <FormularioBanner
          seccionId={seccion.id}
          config={resuelta.config}
          guardando={guardando}
          onGuardar={guardar}
        />
      )
  }
}

function esSeccionTipoConocido(tipo: string): tipo is SeccionTipo {
  return (TIPOS_CONOCIDOS as string[]).includes(tipo)
}

function GuardarBoton({ guardando, onClick }: { guardando: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="sm" onClick={onClick} disabled={guardando} className="mt-3">
      {guardando ? 'Guardando…' : 'Guardar contenido'}
    </Button>
  )
}

function FormularioHero({
  config,
  guardando,
  onGuardar,
}: {
  config: { eyebrow: string; titulo: string; subtitulo: string; ctaTexto: string }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)
  const [subtitulo, setSubtitulo] = useState(config.subtitulo)
  const [ctaTexto, setCtaTexto] = useState(config.ctaTexto)

  return (
    <div className="space-y-3">
      <div>
        <Label>Texto pequeño (encima del título)</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Bajada</Label>
        <Textarea value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} className="mt-1" rows={2} />
      </div>
      <div>
        <Label>Texto del botón</Label>
        <Input value={ctaTexto} onChange={(e) => setCtaTexto(e.target.value)} className="mt-1" />
      </div>
      <GuardarBoton guardando={guardando} onClick={() => onGuardar({ eyebrow, titulo, subtitulo, ctaTexto })} />
    </div>
  )
}

function FormularioTitular({
  config,
  guardando,
  onGuardar,
}: {
  config: { eyebrow: string; titulo: string }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)

  return (
    <div className="space-y-3">
      <div>
        <Label>Texto pequeño (encima del título)</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <GuardarBoton guardando={guardando} onClick={() => onGuardar({ eyebrow, titulo })} />
    </div>
  )
}

function FormularioInstagram({
  config,
  guardando,
  onGuardar,
}: {
  config: { titulo: string }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [titulo, setTitulo] = useState(config.titulo)
  return (
    <div className="space-y-3">
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <GuardarBoton guardando={guardando} onClick={() => onGuardar({ titulo })} />
    </div>
  )
}

function FormularioSobreMi({
  config,
  guardando,
  onGuardar,
}: {
  config: { eyebrow: string; titulo: string; texto: string; texto2: string; firma: string }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)
  const [texto, setTexto] = useState(config.texto)
  const [texto2, setTexto2] = useState(config.texto2)
  const [firma, setFirma] = useState(config.firma)

  return (
    <div className="space-y-3">
      <div>
        <Label>Texto pequeño</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Primer párrafo</Label>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="mt-1" rows={3} />
      </div>
      <div>
        <Label>Segundo párrafo</Label>
        <Textarea value={texto2} onChange={(e) => setTexto2(e.target.value)} className="mt-1" rows={3} />
      </div>
      <div>
        <Label>Firma</Label>
        <Input value={firma} onChange={(e) => setFirma(e.target.value)} className="mt-1" />
      </div>
      <GuardarBoton
        guardando={guardando}
        onClick={() => onGuardar({ eyebrow, titulo, texto, texto2, firma })}
      />
    </div>
  )
}

function FormularioBeneficios({
  config,
  guardando,
  onGuardar,
}: {
  config: { items: { emoji: string; texto: string }[] }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [items, setItems] = useState(config.items)

  function set(i: number, patch: Partial<{ emoji: string; texto: string }>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function agregar() {
    setItems((prev) => [...prev, { emoji: '✨', texto: '' }])
  }
  function quitar(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={it.emoji}
            onChange={(e) => set(i, { emoji: e.target.value })}
            className="w-14 text-center"
            aria-label="Emoji"
          />
          <Input
            value={it.texto}
            onChange={(e) => set(i, { texto: e.target.value })}
            className="flex-1"
            aria-label="Texto del beneficio"
          />
          <Button type="button" size="icon" variant="ghost" onClick={() => quitar(i)} aria-label="Quitar">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={agregar}>
        <Plus className="h-4 w-4" /> Agregar beneficio
      </Button>
      <div>
        <GuardarBoton guardando={guardando} onClick={() => onGuardar({ items })} />
      </div>
    </div>
  )
}

function FormularioResenas({
  config,
  guardando,
  onGuardar,
}: {
  config: { eyebrow: string; titulo: string; items: { nombre: string; texto: string }[] }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)
  const [items, setItems] = useState(config.items)

  function set(i: number, patch: Partial<{ nombre: string; texto: string }>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function agregar() {
    setItems((prev) => [...prev, { nombre: '', texto: '' }])
  }
  function quitar(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Texto pequeño</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>

      <div className="space-y-3 border-t pt-3">
        {items.map((it, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border p-2.5">
            <div className="flex items-center gap-2">
              <Input
                value={it.nombre}
                onChange={(e) => set(i, { nombre: e.target.value })}
                placeholder="Nombre"
                className="flex-1"
              />
              <Button type="button" size="icon" variant="ghost" onClick={() => quitar(i)} aria-label="Quitar reseña">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              value={it.texto}
              onChange={(e) => set(i, { texto: e.target.value })}
              placeholder="Texto de la reseña"
              rows={2}
            />
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={agregar}>
          <Plus className="h-4 w-4" /> Agregar reseña
        </Button>
      </div>

      <GuardarBoton guardando={guardando} onClick={() => onGuardar({ eyebrow, titulo, items })} />
    </div>
  )
}

function FormularioTexto({
  config,
  guardando,
  onGuardar,
}: {
  config: { eyebrow: string; titulo: string; texto: string; ctaTexto: string; ctaHref: string; estilo: EstiloBloque }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)
  const [texto, setTexto] = useState(config.texto)
  const [ctaTexto, setCtaTexto] = useState(config.ctaTexto)
  const [ctaHref, setCtaHref] = useState(config.ctaHref)
  const [estilo, setEstilo] = useState<EstiloBloque>(config.estilo ?? {})

  return (
    <div className="space-y-3">
      <div>
        <Label>Texto pequeño (encima del título)</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Texto</Label>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="mt-1" rows={4} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Texto del botón (opcional)</Label>
          <Input value={ctaTexto} onChange={(e) => setCtaTexto(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Link del botón</Label>
          <Input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            placeholder="/productos"
            className="mt-1"
          />
        </div>
      </div>
      <EstiloEditor estilo={estilo} onChange={setEstilo} />
      <GuardarBoton
        guardando={guardando}
        onClick={() => onGuardar({ eyebrow, titulo, texto, ctaTexto, ctaHref, estilo })}
      />
    </div>
  )
}

function FormularioProductos({
  config,
  productosDisponibles,
  guardando,
  onGuardar,
}: {
  config: {
    eyebrow: string
    titulo: string
    fuente: ProductosFuente
    categoria: string
    productos: string[]
    limite: number
    estilo: EstiloBloque
  }
  productosDisponibles: Producto[]
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)
  const [fuente, setFuente] = useState<ProductosFuente>(config.fuente)
  const [categoria, setCategoria] = useState(config.categoria)
  const [productos, setProductos] = useState<string[]>(config.productos)
  const [limite, setLimite] = useState(String(config.limite))
  const [estilo, setEstilo] = useState<EstiloBloque>(config.estilo ?? {})

  const categorias = Array.from(
    new Set(productosDisponibles.map((p) => p.categoria).filter((c): c is string => !!c)),
  ).sort((a, b) => a.localeCompare(b, 'es'))

  return (
    <div className="space-y-3">
      <div>
        <Label>Texto pequeño (encima del título)</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Qué mostrar</Label>
          <select
            value={fuente}
            onChange={(e) => setFuente(e.target.value as ProductosFuente)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="destacados">Destacados</option>
            <option value="novedades">Novedades (últimos cargados)</option>
            <option value="categoria">Una categoría puntual</option>
            <option value="manual">Elegidos a mano</option>
          </select>
        </div>
        <div>
          <Label>Cantidad máxima</Label>
          <Input
            type="number"
            min={1}
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {fuente === 'categoria' && (
        <div>
          <Label>Categoría</Label>
          <Input
            list="categorias-bloque-productos"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Terror, Manga, Thriller…"
            className="mt-1"
          />
          <datalist id="categorias-bloque-productos">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      )}

      {fuente === 'manual' && (
        <div>
          <Label className="mb-2 block">Elegí los productos</Label>
          <SelectorProductos productosDisponibles={productosDisponibles} value={productos} onChange={setProductos} />
        </div>
      )}

      <EstiloEditor estilo={estilo} onChange={setEstilo} conAlineacion={false} />
      <GuardarBoton
        guardando={guardando}
        onClick={() =>
          onGuardar({
            eyebrow,
            titulo,
            fuente,
            categoria,
            productos,
            limite: Math.max(1, Number(limite) || 8),
            estilo,
          })
        }
      />
    </div>
  )
}

function FormularioBanner({
  seccionId,
  config,
  guardando,
  onGuardar,
}: {
  seccionId: string
  config: {
    eyebrow: string
    titulo: string
    texto: string
    imagen: string | null
    ctaTexto: string
    ctaHref: string
    estilo: EstiloBloque
  }
  guardando: boolean
  onGuardar: (c: Record<string, unknown>) => void
}) {
  const [eyebrow, setEyebrow] = useState(config.eyebrow)
  const [titulo, setTitulo] = useState(config.titulo)
  const [texto, setTexto] = useState(config.texto)
  const [imagen, setImagen] = useState<string | null>(config.imagen)
  const [ctaTexto, setCtaTexto] = useState(config.ctaTexto)
  const [ctaHref, setCtaHref] = useState(config.ctaHref)
  const [estilo, setEstilo] = useState<EstiloBloque>(config.estilo ?? {})

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 block">Imagen de fondo</Label>
        <ImageUploader
          carpeta="secciones"
          entidadId={seccionId}
          portada={imagen}
          onPortadaChange={setImagen}
          soloPortada
        />
      </div>
      <div>
        <Label>Texto pequeño</Label>
        <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Texto</Label>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="mt-1" rows={2} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Texto del botón (opcional)</Label>
          <Input value={ctaTexto} onChange={(e) => setCtaTexto(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Link del botón</Label>
          <Input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            placeholder="/productos"
            className="mt-1"
          />
        </div>
      </div>
      <EstiloEditor estilo={estilo} onChange={setEstilo} />
      <GuardarBoton
        guardando={guardando}
        onClick={() => onGuardar({ eyebrow, titulo, texto, imagen, ctaTexto, ctaHref, estilo })}
      />
    </div>
  )
}
