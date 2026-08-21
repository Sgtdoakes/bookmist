'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, Loader2, Pencil, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { formatARS } from '@/lib/format'
import type { Categoria, ProductoConCategorias, ProductoTipo } from '@/types/db'
import { actualizarProducto, borrarProducto, toggleDestacado } from '@/app/admin/productos/actions'

const TIPO_LABEL: Record<ProductoTipo, string> = {
  caja: 'Caja',
  kit: 'Kit',
  libro: 'Libro',
  accesorio: 'Accesorio',
}

type Visibilidad = 'todos' | 'visibles' | 'ocultos'
type Orden = '' | 'nombre' | 'precio_asc' | 'precio_desc' | 'stock_asc' | 'stock_desc'

const ORDEN_OPCIONES: { value: Orden; label: string }[] = [
  { value: '', label: 'Orden del catálogo' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'stock_asc', label: 'Stock: menor a mayor' },
  { value: 'stock_desc', label: 'Stock: mayor a menor' },
]

// Mismo criterio que el buscador de /productos: sin tildes ni mayúsculas.
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function redondearAbajo(n: number, paso: number) {
  return Math.floor(n / paso) * paso
}
function redondearArriba(n: number, paso: number) {
  return Math.ceil(n / paso) * paso
}

// "Destacados" tiene su propia columna (el toggle) — en la columna de
// categorías solo van las temáticas reales.
function nombresCategorias(p: ProductoConCategorias): string {
  const nombres = p.categorias.filter((c) => c.slug !== 'destacados').map((c) => c.nombre)
  return nombres.length > 0 ? nombres.join(', ') : '—'
}

function esDestacado(p: ProductoConCategorias): boolean {
  return p.categorias.some((c) => c.slug === 'destacados')
}

const CAMPO_CLASE =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30'

export function ProductosManager({ productosIniciales }: { productosIniciales: ProductoConCategorias[] }) {
  const [items, setItems] = useState<ProductoConCategorias[]>(productosIniciales)

  function patch(id: string, cambio: Partial<ProductoConCategorias>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambio } : p)))
  }

  const PASO_PRECIO = 500
  const [precioMin, precioMax] = useMemo(() => {
    if (items.length === 0) return [0, 0]
    const precios = items.map((p) => p.precio)
    return [redondearAbajo(Math.min(...precios), PASO_PRECIO), redondearArriba(Math.max(...precios), PASO_PRECIO)]
  }, [items])
  const [stockMin, stockMax] = useMemo(() => {
    if (items.length === 0) return [0, 0]
    const stocks = items.map((p) => p.stock)
    return [Math.min(...stocks), Math.max(...stocks)]
  }, [items])

  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<ProductoTipo | ''>('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [color, setColor] = useState('')
  const [visibilidad, setVisibilidad] = useState<Visibilidad>('todos')
  const [soloDestacados, setSoloDestacados] = useState(false)
  const [orden, setOrden] = useState<Orden>('')
  const [rangoPrecio, setRangoPrecio] = useState<[number, number]>([precioMin, precioMax])
  const [rangoStock, setRangoStock] = useState<[number, number]>([stockMin, stockMax])

  const tiposDisponibles = useMemo(() => {
    const presentes = new Set(items.map((p) => p.tipo))
    return (Object.keys(TIPO_LABEL) as ProductoTipo[]).filter((t) => presentes.has(t))
  }, [items])

  const categoriasDisponibles = useMemo(() => {
    const mapa = new Map<string, Categoria>()
    for (const p of items) {
      for (const c of p.categorias) {
        if (c.slug !== 'destacados') mapa.set(c.id, c)
      }
    }
    return [...mapa.values()].sort((a, b) => a.orden - b.orden)
  }, [items])

  // Los colores son las etiquetas de variante (ej. "Celeste") — no hay una
  // paleta fija, se arma con lo que haya cargado en el catálogo.
  const coloresDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const p of items) {
      if (p.variante_etiqueta) set.add(p.variante_etiqueta)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [items])

  const rangoPrecioTocado = rangoPrecio[0] > precioMin || rangoPrecio[1] < precioMax
  const rangoStockTocado = rangoStock[0] > stockMin || rangoStock[1] < stockMax
  const hayFiltros =
    busqueda.trim() !== '' ||
    tipo !== '' ||
    categoriaId !== null ||
    color !== '' ||
    visibilidad !== 'todos' ||
    soloDestacados ||
    orden !== '' ||
    rangoPrecioTocado ||
    rangoStockTocado

  const filtrados = useMemo(() => {
    let lista = items

    if (busqueda.trim()) {
      const q = normalizar(busqueda.trim())
      lista = lista.filter(
        (p) =>
          normalizar(p.nombre).includes(q) ||
          (p.autor && normalizar(p.autor).includes(q)) ||
          (p.descripcion && normalizar(p.descripcion).includes(q)),
      )
    }
    if (tipo) lista = lista.filter((p) => p.tipo === tipo)
    if (categoriaId) lista = lista.filter((p) => p.categorias.some((c) => c.id === categoriaId))
    if (color) lista = lista.filter((p) => p.variante_etiqueta === color)
    if (visibilidad === 'visibles') lista = lista.filter((p) => p.activo)
    if (visibilidad === 'ocultos') lista = lista.filter((p) => !p.activo)
    if (soloDestacados) lista = lista.filter(esDestacado)
    if (rangoPrecioTocado) lista = lista.filter((p) => p.precio >= rangoPrecio[0] && p.precio <= rangoPrecio[1])
    if (rangoStockTocado) lista = lista.filter((p) => p.stock >= rangoStock[0] && p.stock <= rangoStock[1])

    switch (orden) {
      case 'nombre':
        return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      case 'precio_asc':
        return [...lista].sort((a, b) => a.precio - b.precio)
      case 'precio_desc':
        return [...lista].sort((a, b) => b.precio - a.precio)
      case 'stock_asc':
        return [...lista].sort((a, b) => a.stock - b.stock)
      case 'stock_desc':
        return [...lista].sort((a, b) => b.stock - a.stock)
      default:
        return lista
    }
  }, [items, busqueda, tipo, categoriaId, color, visibilidad, soloDestacados, orden, rangoPrecio, rangoStock, rangoPrecioTocado, rangoStockTocado])

  function limpiar() {
    setBusqueda('')
    setTipo('')
    setCategoriaId(null)
    setColor('')
    setVisibilidad('todos')
    setSoloDestacados(false)
    setOrden('')
    setRangoPrecio([precioMin, precioMax])
    setRangoStock([stockMin, stockMax])
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Todavía no hay productos cargados.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="prod-busqueda" className="mb-1 block text-xs font-medium text-muted-foreground">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="prod-busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, autor, descripción…"
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-tipo" className="mb-1 block text-xs font-medium text-muted-foreground">
              Tipo
            </label>
            <select
              id="prod-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ProductoTipo | '')}
              className={`${CAMPO_CLASE} w-32`}
            >
              <option value="">Todos</option>
              {tiposDisponibles.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          {coloresDisponibles.length > 0 && (
            <div>
              <label htmlFor="prod-color" className="mb-1 block text-xs font-medium text-muted-foreground">
                Color
              </label>
              <select
                id="prod-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`${CAMPO_CLASE} w-32`}
              >
                <option value="">Todos</option>
                {coloresDisponibles.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="prod-orden" className="mb-1 block text-xs font-medium text-muted-foreground">
              Ordenar por
            </label>
            <select
              id="prod-orden"
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className={`${CAMPO_CLASE} w-48`}
            >
              {ORDEN_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Estado</span>
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                variant={visibilidad === 'todos' ? 'default' : 'outline'}
                onClick={() => setVisibilidad('todos')}
              >
                Todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant={visibilidad === 'visibles' ? 'default' : 'outline'}
                onClick={() => setVisibilidad('visibles')}
              >
                Visibles
              </Button>
              <Button
                type="button"
                size="sm"
                variant={visibilidad === 'ocultos' ? 'default' : 'outline'}
                onClick={() => setVisibilidad('ocultos')}
              >
                Ocultos
              </Button>
              <Button
                type="button"
                size="sm"
                variant={soloDestacados ? 'default' : 'outline'}
                onClick={() => setSoloDestacados((v) => !v)}
              >
                Destacados
              </Button>
            </div>
          </div>
        </div>

        {categoriasDisponibles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={categoriaId === null ? 'default' : 'outline'}
              onClick={() => setCategoriaId(null)}
            >
              Todas las categorías
            </Button>
            {categoriasDisponibles.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={categoriaId === c.id ? 'default' : 'outline'}
                onClick={() => setCategoriaId(categoriaId === c.id ? null : c.id)}
              >
                {c.nombre}
              </Button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {precioMax > precioMin && (
            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Precio: {formatARS(rangoPrecio[0])} – {formatARS(rangoPrecio[1])}
              </span>
              <RangoDoble
                min={precioMin}
                max={precioMax}
                paso={PASO_PRECIO}
                valor={rangoPrecio}
                onChange={setRangoPrecio}
                ariaLabelDesde="Precio mínimo"
                ariaLabelHasta="Precio máximo"
              />
            </div>
          )}
          {stockMax > stockMin && (
            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Stock: {rangoStock[0]} – {rangoStock[1]}
              </span>
              <RangoDoble
                min={stockMin}
                max={stockMax}
                paso={1}
                valor={rangoStock}
                onChange={setRangoStock}
                ariaLabelDesde="Stock mínimo"
                ariaLabelHasta="Stock máximo"
              />
            </div>
          )}
        </div>

        {hayFiltros && (
          <button
            type="button"
            onClick={limpiar}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {hayFiltros && (
        <p className="text-sm text-muted-foreground">
          {filtrados.length} de {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </p>
      )}

      {hayFiltros && filtrados.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Ningún producto coincide con esos filtros.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Destacado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => (
                <FilaProducto
                  key={p.id}
                  producto={p}
                  onPatch={patch}
                  onRemove={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Slider doble de rango: dos <input type="range"> superpuestos. El truco
// estándar: los inputs no reciben clicks (pointer-events-none) pero sus
// pulgares sí (pointer-events-auto en el pseudo-elemento del thumb) — así
// cada pulgar se arrastra de forma independiente sobre el mismo riel. Mismo
// patrón que el buscador de /productos (catalogo-interactivo.tsx).
const THUMB =
  'pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 ' +
  '[&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow ' +
  '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 ' +
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 ' +
  '[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow'

function RangoDoble({
  min,
  max,
  paso,
  valor,
  onChange,
  ariaLabelDesde,
  ariaLabelHasta,
}: {
  min: number
  max: number
  paso: number
  valor: [number, number]
  onChange: (v: [number, number]) => void
  ariaLabelDesde: string
  ariaLabelHasta: string
}) {
  const [desde, hasta] = valor
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <div className="relative h-8">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-input" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${pct(desde)}%`, right: `${100 - pct(hasta)}%` }}
      />
      <input
        type="range"
        aria-label={ariaLabelDesde}
        min={min}
        max={max}
        step={paso}
        value={desde}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hasta), hasta])}
        className={THUMB}
      />
      <input
        type="range"
        aria-label={ariaLabelHasta}
        min={min}
        max={max}
        step={paso}
        value={hasta}
        onChange={(e) => onChange([desde, Math.max(Number(e.target.value), desde)])}
        className={THUMB}
      />
    </div>
  )
}

function FilaProducto({
  producto: p,
  onPatch,
  onRemove,
}: {
  producto: ProductoConCategorias
  onPatch: (id: string, patch: Partial<ProductoConCategorias>) => void
  onRemove: (id: string) => void
}) {
  const [precio, setPrecio] = useState(String(p.precio))
  const [stock, setStock] = useState(String(p.stock))
  const [guardando, setGuardando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [zoom, setZoom] = useState(false)

  const cambiado = precio !== String(p.precio) || stock !== String(p.stock)

  async function guardar() {
    const patchLocal = { precio: Number(precio), stock: Number(stock) }
    setGuardando(true)
    const r = await actualizarProducto(p.id, patchLocal)
    setGuardando(false)
    if (r.ok) {
      onPatch(p.id, patchLocal)
      toast.success('Guardado', { description: p.nombre })
    } else {
      toast.error(r.error)
    }
  }

  async function toggleActivo(val: boolean) {
    setTrabajando(true)
    const r = await actualizarProducto(p.id, { activo: val })
    setTrabajando(false)
    if (r.ok) onPatch(p.id, { activo: val })
    else toast.error(r.error)
  }

  // Destacar = pertenecer a la categoría "Destacados" (Fase 6i).
  async function marcarDestacado(val: boolean) {
    setTrabajando(true)
    const r = await toggleDestacado(p.id, val)
    setTrabajando(false)
    if (r.ok) {
      onPatch(p.id, {
        categorias: val
          ? [...p.categorias, r.categoria]
          : p.categorias.filter((c) => c.slug !== 'destacados'),
      })
    } else {
      toast.error(r.error)
    }
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${p.nombre}"? No se puede deshacer.`)) return
    setTrabajando(true)
    const r = await borrarProducto(p.id)
    setTrabajando(false)
    if (r.ok) {
      onRemove(p.id)
      toast.success('Producto borrado')
    } else {
      toast.error(r.error)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => p.imagen_principal && setZoom(true)}
          disabled={!p.imagen_principal}
          className="relative aspect-[3/4] h-14 shrink-0 overflow-hidden rounded-md border bg-muted/30 disabled:cursor-default"
          aria-label={p.imagen_principal ? `Ver detalle de ${p.nombre}` : undefined}
        >
          {p.imagen_principal && (
            <Image src={p.imagen_principal} alt="" fill sizes="56px" className="object-cover" />
          )}
        </button>
        <DetalleProductoDialog producto={p} open={zoom} onOpenChange={setZoom} />
      </TableCell>
      <TableCell>
        <p className="font-medium">{p.nombre}</p>
        <Badge variant="secondary" className="mt-0.5">
          {TIPO_LABEL[p.tipo]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{nombresCategorias(p)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="h-8 w-24"
          />
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="h-8 w-16"
        />
      </TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={p.activo}
          disabled={trabajando}
          onChange={(e) => toggleActivo(e.target.checked)}
          className="size-4"
          aria-label="Visible"
        />
      </TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={esDestacado(p)}
          disabled={trabajando}
          onChange={(e) => marcarDestacado(e.target.checked)}
          className="size-4"
          aria-label="Destacado"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {cambiado && (
            <Button type="button" size="sm" onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
            </Button>
          )}
          <Button type="button" variant="outline" size="icon-sm" aria-label="Ver detalle" onClick={() => setZoom(true)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Link href={`/admin/productos/${p.id}`}>
            <Button type="button" variant="outline" size="icon-sm" aria-label="Editar producto">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={borrar}
            disabled={trabajando}
            aria-label="Borrar producto"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// Detalle completo de un producto en un modal — mismo patrón que el ojito de
// Martín Libros: ver todo sin salir de la lista ni entrar a la ficha de edición.
function DetalleProductoDialog({
  producto: p,
  open,
  onOpenChange,
}: {
  producto: ProductoConCategorias
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogTitle>{p.nombre}</DialogTitle>
        {p.imagen_principal ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted/30">
            <Image src={p.imagen_principal} alt={p.nombre} fill sizes="512px" className="object-contain" />
          </div>
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
        <dl className="space-y-1.5 text-sm">
          <FilaDetalle label="Tipo" valor={TIPO_LABEL[p.tipo]} />
          <FilaDetalle label="Categorías" valor={nombresCategorias(p)} />
          <FilaDetalle label="Precio" valor={formatARS(p.precio)} />
          <FilaDetalle label="Stock" valor={String(p.stock)} />
          <FilaDetalle label="Visible" valor={p.activo ? 'Sí' : 'No'} />
          <FilaDetalle label="Destacado" valor={esDestacado(p) ? 'Sí' : 'No'} />
          {p.descripcion && <FilaDetalle label="Descripción" valor={p.descripcion} />}
        </dl>
      </DialogContent>
    </Dialog>
  )
}

function FilaDetalle({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{valor}</dd>
    </div>
  )
}
