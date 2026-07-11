'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ProductCard } from '@/components/public/product-card'
import { resolverFondo, resolverRadio, resolverTamano } from '@/lib/estilo-secciones'
import { formatARS } from '@/lib/format'
import type { EstiloBloque } from '@/lib/estilo-secciones'
import type { Categoria, ProductoConCategorias } from '@/types/db'

// Catálogo interactivo de /productos: buscador, orden, rango de precios y
// navegación por categoría. Todo client-side sobre el catálogo completo (el
// catálogo de Bookmist es de decenas de SKUs — filtrar en memoria es
// instantáneo y la página sigue siendo estática/ISR).
//
// Dos vistas: sin filtros activos muestra secciones por categoría (los
// "bloques" con los nombres de las categorías que pidió Dani); con
// cualquier filtro/orden activo pasa a una grilla unificada de resultados.

type Orden = 'recientes' | 'precio_desc' | 'precio_asc' | 'alfabetico' | ''

const ORDEN_OPCIONES: { value: Orden; label: string }[] = [
  { value: '', label: 'Orden original' },
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'alfabetico', label: 'Alfabético (A-Z)' },
]

// Búsqueda sin tildes ni mayúsculas: "marcapaginas" encuentra "Marcapáginas".
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

export function CatalogoInteractivo({
  eyebrow,
  titulo,
  productos,
  categorias,
  estilo,
}: {
  eyebrow: string
  titulo: string
  productos: ProductoConCategorias[]
  categorias: Categoria[]
  estilo: EstiloBloque
}) {
  const PASO = 500
  const [minPosible, maxPosible] = useMemo(() => {
    if (productos.length === 0) return [0, 0]
    const precios = productos.map((p) => p.precio)
    return [redondearAbajo(Math.min(...precios), PASO), redondearArriba(Math.max(...precios), PASO)]
  }, [productos])

  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('')
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [rango, setRango] = useState<[number, number]>([minPosible, maxPosible])

  // Permite linkear directo a una categoría desde cualquier lado del sitio:
  // /productos?categoria=marcapaginas — se lee una sola vez al montar. No se
  // puede leer en el servidor (página estática/ISR) ni en el initializer del
  // useState (el HTML del servidor no conoce la URL: habría un mismatch de
  // hidratación). El setState acá es el caso legítimo: un único re-render
  // extra al montar, y solo si vino el parámetro.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('categoria')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (slug && categorias.some((c) => c.slug === slug)) setCategoriaActiva(slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rangoTocado = rango[0] > minPosible || rango[1] < maxPosible
  const hayFiltros = busqueda.trim() !== '' || orden !== '' || categoriaActiva !== null || rangoTocado

  const filtrados = useMemo(() => {
    let lista = productos

    if (busqueda.trim()) {
      const q = normalizar(busqueda.trim())
      lista = lista.filter(
        (p) =>
          normalizar(p.nombre).includes(q) ||
          (p.autor && normalizar(p.autor).includes(q)) ||
          (p.descripcion && normalizar(p.descripcion).includes(q)),
      )
    }
    if (categoriaActiva) {
      lista = lista.filter((p) => p.categorias.some((c) => c.slug === categoriaActiva))
    }
    if (rangoTocado) {
      lista = lista.filter((p) => p.precio >= rango[0] && p.precio <= rango[1])
    }

    switch (orden) {
      case 'recientes':
        return [...lista].sort((a, b) => b.created_at.localeCompare(a.created_at))
      case 'precio_desc':
        return [...lista].sort((a, b) => b.precio - a.precio)
      case 'precio_asc':
        return [...lista].sort((a, b) => a.precio - b.precio)
      case 'alfabetico':
        return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      default:
        return lista
    }
  }, [productos, busqueda, categoriaActiva, rango, rangoTocado, orden])

  // Secciones por categoría (vista por defecto). Solo categorías con
  // productos; los que no tienen ninguna van a "Otros" al final.
  const secciones = useMemo(() => {
    const resultado: { categoria: Categoria | null; productos: ProductoConCategorias[] }[] = []
    for (const c of categorias) {
      const deLaCategoria = productos.filter((p) => p.categorias.some((x) => x.id === c.id))
      if (deLaCategoria.length > 0) resultado.push({ categoria: c, productos: deLaCategoria })
    }
    const sinCategoria = productos.filter((p) => p.categorias.length === 0)
    if (sinCategoria.length > 0) resultado.push({ categoria: null, productos: sinCategoria })
    return resultado
  }, [productos, categorias])

  function limpiar() {
    setBusqueda('')
    setOrden('')
    setCategoriaActiva(null)
    setRango([minPosible, maxPosible])
  }

  const tamano = resolverTamano(estilo)
  const radioClase = resolverRadio(estilo)
  const fondoClase = resolverFondo(estilo)
  const conFondo = !!estilo?.fondo && estilo.fondo !== 'transparente'

  if (productos.length === 0) return null

  return (
    <section className="w-full">
      <div className={`mx-auto max-w-7xl px-6 md:px-10 ${tamano.padding}`}>
        <div className={`${fondoClase} ${radioClase} ${conFondo ? 'p-6 md:p-10' : ''}`}>
          <div className="mb-8 text-center">
            {eyebrow && <p className="font-script mb-1 text-xl text-muted">{eyebrow}</p>}
            {titulo && (
              <h2 className={`font-heading font-semibold text-foreground ${tamano.titulo}`}>{titulo}</h2>
            )}
          </div>

          {/* Barra de búsqueda + orden + rango de precios */}
          <div className="mb-6 grid gap-4 rounded-2xl bg-card/60 p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <label htmlFor="catalogo-busqueda" className="mb-1 block text-xs font-medium text-muted-foreground">
                Buscar
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="catalogo-busqueda"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre, autor…"
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="catalogo-orden" className="mb-1 block text-xs font-medium text-muted-foreground">
                Ordenar por
              </label>
              <select
                id="catalogo-orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value as Orden)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground md:w-56"
              >
                {ORDEN_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {maxPosible > minPosible && (
              <div className="md:w-64">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Precio: {formatARS(rango[0])} – {formatARS(rango[1])}
                </span>
                <RangoPrecios
                  min={minPosible}
                  max={maxPosible}
                  paso={PASO}
                  valor={rango}
                  onChange={setRango}
                />
              </div>
            )}
          </div>

          {/* Chips de categoría */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            <Chip activa={categoriaActiva === null && !hayFiltros} onClick={limpiar}>
              Todas
            </Chip>
            {secciones
              .filter((s) => s.categoria)
              .map((s) => (
                <Chip
                  key={s.categoria!.id}
                  activa={categoriaActiva === s.categoria!.slug}
                  onClick={() =>
                    setCategoriaActiva(categoriaActiva === s.categoria!.slug ? null : s.categoria!.slug)
                  }
                >
                  {s.categoria!.nombre}
                </Chip>
              ))}
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted underline-offset-2 hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>

          {hayFiltros ? (
            // Vista filtrada: una sola grilla de resultados
            filtrados.length === 0 ? (
              <p className="py-16 text-center text-muted">
                No encontramos productos con esos filtros. Probá con otra búsqueda.
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">
                  {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
                </p>
                <Grilla productos={filtrados} />
              </>
            )
          ) : (
            // Vista por defecto: una sección por categoría
            <div className="space-y-14">
              {secciones.map((s) => (
                <div key={s.categoria?.id ?? 'otros'} id={s.categoria?.slug ?? 'otros'}>
                  <h3 className="mb-5 font-heading text-2xl font-semibold text-foreground">
                    {s.categoria?.nombre ?? 'Otros'}
                  </h3>
                  <Grilla productos={s.productos} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Grilla({ productos }: { productos: ProductoConCategorias[] }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {productos.map((p) => (
        <ProductCard key={p.id} producto={p} />
      ))}
    </div>
  )
}

function Chip({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        activa
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-foreground hover:border-primary'
      }`}
    >
      {children}
    </button>
  )
}

// Slider doble de rango de precios: dos <input type="range"> superpuestos.
// El truco estándar: los inputs no reciben clicks (pointer-events-none) pero
// sus pulgares sí (pointer-events-auto en el pseudo-elemento del thumb) —
// así cada pulgar se arrastra de forma independiente sobre el mismo riel.
const THUMB =
  'pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 ' +
  '[&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow ' +
  '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 ' +
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 ' +
  '[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow'

function RangoPrecios({
  min,
  max,
  paso,
  valor,
  onChange,
}: {
  min: number
  max: number
  paso: number
  valor: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const [desde, hasta] = valor
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <div className="relative h-10">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-input" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${pct(desde)}%`, right: `${100 - pct(hasta)}%` }}
      />
      <input
        type="range"
        aria-label="Precio mínimo"
        min={min}
        max={max}
        step={paso}
        value={desde}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hasta), hasta])}
        className={THUMB}
      />
      <input
        type="range"
        aria-label="Precio máximo"
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
