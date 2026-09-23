'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bold, ExternalLink, Heading2, Link2, List, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/admin/image-uploader'
import { SelectorProductos } from '@/components/admin/selector-productos'
import { CuerpoNota } from '@/components/public/cuerpo-nota'
import { generarSlug } from '@/lib/slugs'
import { borrarNota, guardarNota } from '@/app/admin/blog/actions'
import type { NotaBlog, Producto } from '@/types/db'

type Props = {
  // Sin nota = alta. El id lo genera la página de "Nueva nota" para que la
  // foto se pueda subir antes del primer guardado.
  nota?: NotaBlog
  idNuevo?: string
  productosDisponibles: Producto[]
}

const MAX_BAJADA = 500

export function NotaForm({ nota, idNuevo, productosDisponibles }: Props) {
  const router = useRouter()
  const id = nota?.id ?? idNuevo!
  const [titulo, setTitulo] = useState(nota?.titulo ?? '')
  const [slug, setSlug] = useState(nota?.slug ?? '')
  // Una nota ya guardada no cambia de dirección sola al retocar el título:
  // el link viejo (compartido en Instagram, indexado por Google) dejaría de
  // andar.
  const [slugTocado, setSlugTocado] = useState(!!nota)
  const [bajada, setBajada] = useState(nota?.bajada ?? '')
  const [imagen, setImagen] = useState<string | null>(nota?.imagen ?? null)
  const [cuerpo, setCuerpo] = useState(nota?.cuerpo ?? '')
  const [productoIds, setProductoIds] = useState<string[]>(nota?.producto_ids ?? [])
  const [publicado, setPublicado] = useState(nota?.publicado ?? false)
  const [vista, setVista] = useState<'escribir' | 'previa'>('escribir')
  const [pickerAbierto, setPickerAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [sucio, setSucio] = useState(false)
  const cuerpoRef = useRef<HTMLTextAreaElement>(null)
  const seleccionPendiente = useRef<[number, number] | null>(null)

  // La foto se sube apenas se elige, pero la nota recién se guarda con el
  // botón: sin este aviso, cerrar la pestaña después de subir una foto la
  // perdía sin que nadie se entere.
  useEffect(() => {
    if (!sucio) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio])

  function cambio<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setSucio(true)
    }
  }

  function onTituloChange(v: string) {
    setTitulo(v)
    if (!slugTocado) setSlug(generarSlug(v))
    setSucio(true)
  }

  // Reemplaza lo seleccionado en el cuerpo por lo que arma `armar`, y deja
  // seleccionado el pedazo que conviene tipear encima (ej. "Subtítulo").
  function insertar(armar: (seleccion: string) => { texto: string; marcar?: [number, number] }) {
    const ta = cuerpoRef.current
    const desde = ta?.selectionStart ?? cuerpo.length
    const hasta = ta?.selectionEnd ?? cuerpo.length
    const { texto, marcar } = armar(cuerpo.slice(desde, hasta))
    const [a, b] = marcar ?? [texto.length, texto.length]
    seleccionPendiente.current = [desde + a, desde + b]
    setCuerpo(cuerpo.slice(0, desde) + texto + cuerpo.slice(hasta))
    setSucio(true)
    setVista('escribir')
  }

  // La selección se aplica después de que React escribió el texto nuevo en
  // el textarea (si se aplicara antes, al pisar el value el cursor salta al
  // final). Un efecto y no requestAnimationFrame: rAF no corre mientras la
  // pestaña está en segundo plano.
  useLayoutEffect(() => {
    const sel = seleccionPendiente.current
    const ta = cuerpoRef.current
    if (!sel || !ta) return
    seleccionPendiente.current = null
    ta.focus()
    ta.setSelectionRange(sel[0], sel[1])
  }, [cuerpo, vista])

  const envolverEnBloque = (prefijo: string, porDefecto: string) =>
    insertar((sel) => {
      const contenido = sel.trim() || porDefecto
      const antes = '\n\n' + prefijo
      return { texto: `${antes}${contenido}\n\n`, marcar: [antes.length, antes.length + contenido.length] }
    })

  const negrita = () =>
    insertar((sel) => {
      const contenido = sel || 'texto en negrita'
      return { texto: `**${contenido}**`, marcar: [2, 2 + contenido.length] }
    })

  function linkAProducto(p: Producto) {
    insertar((sel) => {
      const texto = sel.trim() || p.nombre
      return { texto: `[${texto}](/productos/${p.slug})` }
    })
    setPickerAbierto(false)
    setBusqueda('')
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = q ? productosDisponibles.filter((p) => p.nombre.toLowerCase().includes(q)) : productosDisponibles
    return lista.slice(0, 30)
  }, [busqueda, productosDisponibles])

  async function onGuardar() {
    if (!titulo.trim()) return toast.error('El título es obligatorio.')
    if (!slug.trim()) return toast.error('Falta la dirección de la nota.')
    setGuardando(true)
    const r = await guardarNota({ id, slug, titulo, bajada, imagen, cuerpo, productoIds, publicado })
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    setSucio(false)
    toast.success(publicado ? 'Nota guardada y publicada' : 'Borrador guardado')
    if (!nota) router.replace(`/admin/blog/${id}`)
    router.refresh()
  }

  async function onBorrar() {
    if (!nota) return
    if (!confirm(`¿Borrar la nota "${nota.titulo}"? No se puede deshacer.`)) return
    const r = await borrarNota(nota.id)
    if (!r.ok) return toast.error(r.error)
    setSucio(false)
    toast.success('Nota borrada')
    router.replace('/admin/blog')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <Label htmlFor="nota-titulo">Título</Label>
          <Input
            id="nota-titulo"
            value={titulo}
            onChange={(e) => onTituloChange(e.target.value)}
            placeholder="Ej: 5 libros para leer este otoño"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="nota-slug">Dirección</Label>
          <Input
            id="nota-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTocado(true)
              setSucio(true)
            }}
            className="mt-1 font-mono text-sm"
          />
          <p className="mt-1 truncate text-xs text-muted-foreground">bookmist.com.ar/blog/{slug || '…'}</p>
        </div>
      </div>

      <div>
        <Label htmlFor="nota-bajada">Bajada</Label>
        <Textarea
          id="nota-bajada"
          value={bajada}
          onChange={(e) => cambio(setBajada)(e.target.value)}
          maxLength={MAX_BAJADA}
          rows={2}
          placeholder="Una o dos líneas que resumen la nota. Es lo que se ve en el listado y en Google."
          className="mt-1"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {bajada.length}/{MAX_BAJADA}
        </p>
      </div>

      <div>
        <Label>Imagen</Label>
        <div className="mt-1">
          <ImageUploader
            carpeta="blog"
            entidadId={id}
            portada={imagen}
            onPortadaChange={cambio(setImagen)}
            soloPortada
          />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="nota-cuerpo">Texto de la nota</Label>
          <div className="flex rounded-md border p-0.5 text-sm">
            {(['escribir', 'previa'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={`rounded px-3 py-1 ${vista === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {v === 'escribir' ? 'Escribir' : 'Vista previa'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => envolverEnBloque('## ', 'Subtítulo')}>
            <Heading2 className="h-4 w-4" /> Subtítulo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={negrita}>
            <Bold className="h-4 w-4" /> Negrita
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => envolverEnBloque('- ', 'Primer ítem')}>
            <List className="h-4 w-4" /> Lista
          </Button>
          <Button
            type="button"
            variant={pickerAbierto ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPickerAbierto((v) => !v)}
          >
            <Link2 className="h-4 w-4" /> Link a producto
          </Button>
        </div>

        {pickerAbierto && (
          <div className="mt-2 rounded-lg border p-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Elegí el producto. Si antes seleccionaste una palabra del texto, esa palabra pasa a ser el link;
              si no, se inserta el nombre del producto.
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto…"
                className="pl-8"
              />
            </div>
            <ul className="mt-2 max-h-60 overflow-y-auto">
              {filtrados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    // onMouseDown y no onClick: así el textarea no pierde la
                    // selección antes de que se inserte el link.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => linkAProducto(p)}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted/50"
                  >
                    {p.nombre}
                  </button>
                </li>
              ))}
              {filtrados.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados.</li>}
            </ul>
          </div>
        )}

        {vista === 'escribir' ? (
          <>
            <Textarea
              id="nota-cuerpo"
              ref={cuerpoRef}
              value={cuerpo}
              onChange={(e) => cambio(setCuerpo)(e.target.value)}
              rows={18}
              placeholder="Escribí la nota. Dejá una línea en blanco entre párrafos."
              className="mt-2 min-h-80 font-mono text-sm leading-relaxed"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Línea en blanco = párrafo nuevo. <code>## </code> al principio = subtítulo. <code>**así**</code> =
              negrita. <code>[texto](/productos/…)</code> = link (también sirve con cualquier dirección https://).
            </p>
          </>
        ) : (
          // Mismo componente que la página pública, sobre el mismo fondo.
          <div className="mt-2 min-h-40 rounded-lg bg-background p-5">
            {cuerpo.trim() ? (
              <CuerpoNota cuerpo={cuerpo} />
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no escribiste nada.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>Productos de esta nota</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Aparecen al final de la nota como tarjetas, con precio y botón de agregar al carrito, en el orden en
          que los elijas. Opcional.
        </p>
        <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border p-3">
          <SelectorProductos
            productosDisponibles={productosDisponibles}
            value={productoIds}
            onChange={cambio(setProductoIds)}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={publicado}
          onChange={(e) => cambio(setPublicado)(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Publicada (se ve en el sitio)
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button type="button" onClick={onGuardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
        {nota?.publicado && !sucio && (
          <Link
            href={`/blog/${nota.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Ver en el sitio <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
        {sucio && <span className="text-sm text-amber-500">Tenés cambios sin guardar.</span>}
        {nota && (
          <Button type="button" variant="outline" size="sm" onClick={onBorrar} className="ml-auto">
            <Trash2 className="h-4 w-4" /> Borrar nota
          </Button>
        )}
      </div>
    </div>
  )
}
