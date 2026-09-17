'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BookOpen, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/format'
import { esIsbnPlausible, limpiarIsbn } from '@/lib/isbn-formato'
import {
  buscarDatosPorIsbn,
  buscarLibrosEnMartinLibros,
  buscarProductoConIsbn,
} from '@/app/admin/productos/actions'
import type { LibroDeML } from '@/lib/catalogo-ml-datos'

// Todo como string: son los valores de los inputs. El formulario los convierte
// al guardar, igual que ya hace con precio/stock/peso.
export type FichaLibro = {
  autor: string
  editorial: string
  isbn: string
  paginas: string
  anio: string
  idioma: string
  formato: string
}

// Lo que un libro elegido puede completar del PRODUCTO (no de la ficha). El
// formulario decide qué hacer con cada campo: los datos duros del libro se
// pisan siempre, pero el nombre, la descripción, el precio y la foto son
// decisiones de Dani y solo se completan si están vacíos.
export type CompletarProducto = {
  titulo?: string | null
  descripcion?: string | null
  precio?: number | null
  tapa?: string | null
}

type Props = {
  ficha: FichaLibro
  onFicha: (patch: Partial<FichaLibro>) => void
  onCompletarProducto: (datos: CompletarProducto) => void
  productoId?: string
}

export function DatosLibro({ ficha, onFicha, onCompletarProducto, productoId }: Props) {
  const [termino, setTermino] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<LibroDeML[] | null>(null)
  const [completando, setCompletando] = useState(false)
  const [duplicado, setDuplicado] = useState<{ id: string; nombre: string } | null>(null)

  async function onBuscar() {
    const q = termino.trim()
    if (!q) return
    setBuscando(true)
    const r = await buscarLibrosEnMartinLibros(q)
    setBuscando(false)
    if (!r.ok) {
      setResultados(null)
      return toast.error(r.error)
    }
    setResultados(r.resultados)
    if (r.resultados.length === 0) toast.info('Ningún libro con ese título, autor o ISBN.')
  }

  // Páginas, año e idioma no están en el catálogo de Martín Libros: salen de
  // Google Books. Se completan solos después de elegir un libro con ISBN, así
  // la ficha queda entera de un click y no de dos.
  async function completarDesdeIsbn(isbn: string, avisar: boolean) {
    if (!esIsbnPlausible(isbn)) {
      if (avisar) toast.error('Ese ISBN no parece válido: tiene que tener 10 o 13 dígitos.')
      return
    }
    setCompletando(true)
    const r = await buscarDatosPorIsbn(isbn)
    setCompletando(false)
    if (!r.ok) {
      if (avisar) toast.error(r.error)
      return
    }
    const d = r.datos
    onFicha({
      ...(d.autor && !ficha.autor ? { autor: d.autor } : {}),
      ...(d.editorial && !ficha.editorial ? { editorial: d.editorial } : {}),
      ...(d.paginas ? { paginas: String(d.paginas) } : {}),
      ...(d.anio ? { anio: String(d.anio) } : {}),
      ...(d.idioma ? { idioma: d.idioma } : {}),
    })
    // Sin tapa: las de Google/OpenLibrary son miniaturas de ~128 px y esta es
    // la foto principal de un producto (ver src/lib/isbn.ts).
    onCompletarProducto({ titulo: d.titulo, descripcion: d.descripcion })
    if (avisar) {
      toast.success(`Datos traídos de ${d.fuente === 'google' ? 'Google Books' : 'OpenLibrary'}`)
    }
  }

  async function avisarSiDuplicado(isbn: string) {
    const limpio = limpiarIsbn(isbn)
    if (!limpio) return setDuplicado(null)
    setDuplicado(await buscarProductoConIsbn(limpio, productoId))
  }

  async function usarLibro(libro: LibroDeML) {
    const isbn = limpiarIsbn(libro.isbn ?? '')
    onFicha({
      autor: libro.autor ?? '',
      editorial: libro.editorial ?? '',
      isbn,
    })
    onCompletarProducto({
      titulo: libro.titulo,
      descripcion: libro.descripcion,
      precio: libro.precio,
      tapa: libro.tapa,
    })
    setResultados(null)
    setTermino('')
    toast.success(`"${libro.titulo}" traído de Martín Libros`)
    if (isbn) {
      await avisarSiDuplicado(isbn)
      await completarDesdeIsbn(isbn, false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Datos del libro</h3>
      </div>

      {/* Buscador del catálogo de Martín Libros (450k+ títulos). */}
      <div>
        <Label htmlFor="buscar-libro">Traer de Martín Libros</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Buscá por título, autor o ISBN y elegí el libro: se completan autor, editorial, ISBN,
          descripción, tapa y un precio de referencia.
        </p>
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="buscar-libro"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              // El form de producto se envía con Enter; acá Enter tiene que
              // buscar, no guardar un producto a medio cargar.
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void onBuscar()
                }
              }}
              placeholder="Alas de sangre, Yarros, 9788408270331…"
              className="pl-8"
            />
          </div>
          <Button type="button" variant="outline" onClick={onBuscar} disabled={buscando}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
          </Button>
        </div>

        {resultados && resultados.length > 0 && (
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {resultados.map((libro, i) => (
              <li
                key={`${libro.isbn ?? 'sin-isbn'}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-2"
              >
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-muted/40">
                  {libro.tapa ? (
                    <Image src={libro.tapa} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      sin tapa
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{libro.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[libro.autor, libro.editorial].filter(Boolean).join(' · ') || 'Sin autor'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {libro.isbn ? `ISBN ${libro.isbn} · ` : ''}
                    {formatARS(libro.precio)} en Martín Libros
                  </p>
                </div>
                <Button type="button" size="sm" onClick={() => usarLibro(libro)}>
                  Usar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {duplicado && (
        <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-foreground">
          Ojo: ya tenés un producto con este ISBN —{' '}
          <a href={`/admin/productos/${duplicado.id}`} className="font-medium underline">
            {duplicado.nombre}
          </a>
          . Si es a propósito (otra edición, un ejemplar firmado), seguí de largo.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="autor">Autor</Label>
          <Input
            id="autor"
            value={ficha.autor}
            onChange={(e) => onFicha({ autor: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="editorial">Editorial</Label>
          <Input
            id="editorial"
            value={ficha.editorial}
            onChange={(e) => onFicha({ editorial: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="isbn">ISBN</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="isbn"
            value={ficha.isbn}
            onChange={(e) => onFicha({ isbn: e.target.value })}
            onBlur={(e) => avisarSiDuplicado(e.target.value)}
            placeholder="9788408270331"
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => completarDesdeIsbn(ficha.isbn, true)}
            disabled={completando}
          >
            {completando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Completar por ISBN'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Trae páginas, año e idioma desde Google Books (y OpenLibrary si ahí no está) — tres datos
          que el catálogo de Martín Libros no guarda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <Label htmlFor="paginas">Páginas</Label>
          <Input
            id="paginas"
            type="number"
            min={1}
            value={ficha.paginas}
            onChange={(e) => onFicha({ paginas: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="anio">Año</Label>
          <Input
            id="anio"
            type="number"
            value={ficha.anio}
            onChange={(e) => onFicha({ anio: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="idioma">Idioma</Label>
          <Input
            id="idioma"
            value={ficha.idioma}
            onChange={(e) => onFicha({ idioma: e.target.value })}
            placeholder="Español"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="formato">Tapa</Label>
          <select
            id="formato"
            value={ficha.formato}
            onChange={(e) => onFicha({ formato: e.target.value })}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Sin especificar</option>
            <option value="blanda">Tapa blanda</option>
            <option value="dura">Tapa dura</option>
          </select>
        </div>
      </div>
    </div>
  )
}
