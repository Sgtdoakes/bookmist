'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { resolverSeccion, type SeccionTipo } from '@/lib/secciones'
import { guardarConfigSeccion } from '@/app/admin/pagina/actions'
import type { SeccionAdmin } from '@/lib/secciones'

export function SeccionInspector({
  seccion,
  onGuardado,
}: {
  seccion: SeccionAdmin
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
  }
}

const TIPOS_CONOCIDOS: SeccionTipo[] = [
  'hero',
  'beneficios',
  'categorias',
  'mas_vendidos',
  'sobre_mi',
  'resenas',
  'instagram',
]
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
