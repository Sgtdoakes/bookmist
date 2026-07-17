'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImagePlus, Loader2, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subirImagen } from '@/app/admin/media/actions'
import { esVideoUrl } from '@/lib/media'

type Props = {
  carpeta: 'productos' | 'items' | 'secciones'
  entidadId: string
  portada: string | null
  galeria?: string[]
  onPortadaChange: (url: string | null) => void
  onGaleriaChange?: (urls: string[]) => void
  soloPortada?: boolean
  // Habilita el modo "Video" en la portada (pegar un link de Cloudinary en
  // vez de subir un archivo — Bookmist no aloja video propio, ver
  // src/lib/media.ts). Solo tiene sentido donde la portada se muestra de
  // fondo/hero; se deja apagado en logo/favicon.
  permitirVideo?: boolean
}

// Uploader reutilizable: 1 portada (reemplaza, foto o —si permitirVideo—
// video pegado) + N fotos de galería (agregar/quitar/reordenar arrastrando).
// Sube directo a Supabase Storage vía subirImagen() y devuelve la URL al
// padre — el padre decide cuándo persistir. `soloPortada` oculta la galería
// para bloques que solo necesitan 1 imagen (ej. banner).
export function ImageUploader({
  carpeta,
  entidadId,
  portada,
  galeria = [],
  onPortadaChange,
  onGaleriaChange,
  soloPortada = false,
  permitirVideo = false,
}: Props) {
  const portadaInputRef = useRef<HTMLInputElement>(null)
  const galeriaInputRef = useRef<HTMLInputElement>(null)
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const [subiendoGaleria, setSubiendoGaleria] = useState(false)
  const [modo, setModo] = useState<'foto' | 'video'>(esVideoUrl(portada) ? 'video' : 'foto')
  const [videoInput, setVideoInput] = useState(esVideoUrl(portada) ? (portada ?? '') : '')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function subir(archivo: File) {
    const r = await subirImagen(archivo, carpeta, entidadId)
    if (!r.ok) {
      toast.error(r.error)
      return null
    }
    return r.url
  }

  async function onPortadaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendoPortada(true)
    const url = await subir(archivo)
    setSubiendoPortada(false)
    if (url) onPortadaChange(url)
  }

  function usarVideo() {
    const url = videoInput.trim()
    if (!url) return
    onPortadaChange(url)
  }

  async function onGaleriaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendoGaleria(true)
    const url = await subir(archivo)
    setSubiendoGaleria(false)
    if (url) onGaleriaChange?.([...galeria, url])
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = galeria.indexOf(String(active.id))
    const to = galeria.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    onGaleriaChange?.(arrayMove(galeria, from, to))
  }

  return (
    <div className="space-y-4">
      {permitirVideo && (
        <div className="flex gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setModo('foto')}
            className={`rounded-full px-3 py-1 ${modo === 'foto' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'}`}
          >
            Foto
          </button>
          <button
            type="button"
            onClick={() => setModo('video')}
            className={`rounded-full px-3 py-1 ${modo === 'video' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'}`}
          >
            Video (Cloudinary)
          </button>
        </div>
      )}

      {modo === 'video' && permitirVideo ? (
        <div className="space-y-2">
          {portada && esVideoUrl(portada) && (
            <video
              src={portada}
              muted
              loop
              autoPlay
              playsInline
              className="h-24 w-40 rounded-lg border object-cover"
            />
          )}
          <div className="flex gap-2">
            <Input
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="https://res.cloudinary.com/…/video/upload/…"
              className="h-9"
            />
            <Button type="button" size="sm" variant="outline" onClick={usarVideo}>
              Usar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Subí el video a tu cuenta de Cloudinary y pegá acá el link directo del archivo (no el de la página).
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => portadaInputRef.current?.click()}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30"
          >
            {subiendoPortada ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : portada && !esVideoUrl(portada) ? (
              <Image src={portada} alt="Portada" fill sizes="80px" className="object-cover" />
            ) : portada ? (
              <Video className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <input ref={portadaInputRef} type="file" accept="image/*" className="hidden" onChange={onPortadaFile} />
          <div className="text-sm">
            <p className="font-medium">Portada</p>
            <div className="mt-1 flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => portadaInputRef.current?.click()}>
                {portada ? 'Cambiar' : 'Subir'}
              </Button>
              {portada && (
                <Button type="button" size="sm" variant="ghost" onClick={() => onPortadaChange(null)}>
                  Quitar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {!soloPortada && (
      <div>
        <p className="text-sm font-medium">Galería</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={galeria} strategy={horizontalListSortingStrategy}>
            <div className="mt-2 flex flex-wrap gap-2">
              {galeria.map((url) => (
                <GaleriaThumb
                  key={url}
                  url={url}
                  onQuitar={() => onGaleriaChange?.(galeria.filter((u) => u !== url))}
                />
              ))}
              <button
                type="button"
                onClick={() => galeriaInputRef.current?.click()}
                disabled={subiendoGaleria}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground hover:bg-muted/50"
                aria-label="Agregar foto a la galería"
              >
                {subiendoGaleria ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              </button>
            </div>
          </SortableContext>
        </DndContext>
        <input ref={galeriaInputRef} type="file" accept="image/*" className="hidden" onChange={onGaleriaFile} />
      </div>
      )}
    </div>
  )
}

function GaleriaThumb({ url, onQuitar }: { url: string; onQuitar: () => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: url })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative h-16 w-16 shrink-0 touch-none overflow-hidden rounded-lg border ${isDragging ? 'opacity-40' : ''}`}
    >
      {esVideoUrl(url) ? (
        <video src={url} muted className="h-full w-full object-cover" />
      ) : (
        <Image src={url} alt="" fill sizes="64px" className="object-cover" />
      )}
      <button
        type="button"
        className="absolute inset-0 flex cursor-grab items-center justify-center bg-black/0 text-white opacity-0 transition-opacity active:cursor-grabbing group-hover:bg-black/20 group-hover:opacity-100"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onQuitar}
        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Quitar foto"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
