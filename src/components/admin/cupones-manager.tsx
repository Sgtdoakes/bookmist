'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Loader2, Plus, Search, Sparkles, Ticket, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { armarCsv, descargarCsv, sufijoFechaArchivo } from '@/lib/csv'
import { estadoCupon, type EstadoCupon } from '@/lib/cupon-codigo'
import type { Cupon } from '@/types/db'
import {
  actualizarCupon,
  borrarCupon,
  borrarCupones,
  crearCupon,
  generarTandaCupones,
} from '@/app/admin/cupones/actions'

const ESTADO_ETIQUETA: Record<EstadoCupon, string> = {
  disponible: 'Sin usar',
  usado: 'Usado',
  agotado: 'Agotado',
  apagado: 'Apagado',
}

// `outline` para los que todavía sirven y `secondary` (apagado) para los que
// ya no: de un vistazo se tiene que ver cuáles quedan vivos después de
// repartir una tanda, sin leer cada fila.
const ESTADO_VARIANTE: Record<EstadoCupon, 'default' | 'secondary' | 'outline'> = {
  disponible: 'default',
  usado: 'secondary',
  agotado: 'secondary',
  apagado: 'outline',
}

type Filtro = 'todos' | 'vivos' | 'muertos'

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function reglaCupon(c: Cupon): string {
  if (c.es_bienvenida) return 'Se manda por mail al suscribirse'
  if (c.usos_maximos === 1) return 'Un solo uso'
  if (c.usos_maximos != null) return `Hasta ${c.usos_maximos} usos`
  if (c.una_vez_por_email) return 'Uno por persona'
  return 'Sin límite de usos'
}

// El mapa de usos viene del server con las claves en mayúsculas (las arma
// contarUsosPorCodigo normalizando orders.cupon_codigo).
function estadoDe(cupon: Cupon, usos: Record<string, number>): EstadoCupon {
  return estadoCupon(cupon, usos[cupon.codigo.toUpperCase()] ?? 0)
}

export function CuponesManager({
  cuponesIniciales,
  usosIniciales,
}: {
  cuponesIniciales: Cupon[]
  usosIniciales: Record<string, number>
}) {
  const [items, setItems] = useState<Cupon[]>(cuponesIniciales)
  // Los usos vienen contados del server y no cambian mientras Dani está en
  // esta pantalla (los genera un cliente comprando, no ella).
  const usos = usosIniciales

  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  // Códigos recién generados: se muestran aparte y grandes porque este es el
  // único momento en que están juntos y en orden. Es lo que Dani copia o
  // imprime para salir a repartir; después se mezclan con el resto de la
  // lista y volver a juntarlos es un trabajo manual.
  const [ultimaTanda, setUltimaTanda] = useState<{ codigos: string[]; pct: number; nota: string } | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toUpperCase()
    return items.filter((c) => {
      if (q && !c.codigo.toUpperCase().includes(q) && !(c.nota ?? '').toUpperCase().includes(q)) return false
      const estado = estadoDe(c, usos)
      if (filtro === 'vivos') return estado === 'disponible' || estado === 'usado'
      if (filtro === 'muertos') return estado === 'agotado' || estado === 'apagado'
      return true
    })
  }, [items, busqueda, filtro, usos])

  // Solo los agotados: un cupón apagado se puede volver a prender, uno
  // agotado ya no sirve para nada y solo ensucia la lista.
  const agotados = useMemo(
    () => items.filter((c) => !c.es_bienvenida && estadoDe(c, usos) === 'agotado'),
    [items, usos],
  )

  function bajarCsvLista() {
    const filas = [
      ['Código', 'Descuento', 'Estado', 'Usos', 'Regla', 'Nota', 'Creado'],
      ...filtrados.map((c) => [
        c.codigo,
        `${c.pct}%`,
        ESTADO_ETIQUETA[estadoDe(c, usos)],
        usos[c.codigo.toUpperCase()] ?? 0,
        reglaCupon(c),
        c.nota ?? '',
        fechaCorta(c.created_at),
      ]),
    ]
    descargarCsv(`cupones-${sufijoFechaArchivo()}`, armarCsv(filas))
  }

  async function limpiarAgotados() {
    if (agotados.length === 0) return
    if (!window.confirm(`¿Borrar ${agotados.length} cupones ya agotados? No se puede deshacer.`)) return
    const ids = agotados.map((c) => c.id)
    const r = await borrarCupones(ids)
    if (!r.ok) return toast.error(r.error)
    const borrados = new Set(ids)
    setItems((prev) => prev.filter((c) => !borrados.has(c.id)))
    toast.success(`${r.borrados} cupones borrados`)
  }

  return (
    <div className="space-y-6">
      <GeneradorTanda
        onGenerado={(nuevos, pct, nota) => {
          setUltimaTanda({ codigos: nuevos.map((c) => c.codigo), pct, nota })
          setItems((prev) => [...nuevos, ...prev])
        }}
      />

      {ultimaTanda && (
        <TandaGenerada tanda={ultimaTanda} onCerrar={() => setUltimaTanda(null)} />
      )}

      <CuponManual onCreado={(c) => setItems((prev) => [c, ...prev])} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[14rem] flex-1">
            <Label htmlFor="cupon-busqueda" className="text-xs text-muted-foreground">
              Buscar
            </Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cupon-busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Código o nota de la tanda…"
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={filtro === 'todos' ? 'default' : 'outline'} onClick={() => setFiltro('todos')}>
              Todos
            </Button>
            <Button size="sm" variant={filtro === 'vivos' ? 'default' : 'outline'} onClick={() => setFiltro('vivos')}>
              Sirven
            </Button>
            <Button
              size="sm"
              variant={filtro === 'muertos' ? 'default' : 'outline'}
              onClick={() => setFiltro('muertos')}
            >
              Ya no sirven
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={bajarCsvLista} disabled={filtrados.length === 0}>
            <Download className="h-4 w-4" />
            Descargar lista
          </Button>
          {agotados.length > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={limpiarAgotados}>
              <Trash2 className="h-4 w-4" />
              Borrar los {agotados.length} agotados
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {filtrados.length} de {items.length} {items.length === 1 ? 'cupón' : 'cupones'}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Todavía no hay cupones. Generá una tanda acá arriba.
          </p>
        ) : filtrados.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Ningún cupón coincide con esa búsqueda.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Regla</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => (
                  <FilaCupon
                    key={c.id}
                    cupon={c}
                    usos={usos[c.codigo.toUpperCase()] ?? 0}
                    estado={estadoDe(c, usos)}
                    onPatch={(id, cambio) =>
                      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...cambio } : x)))
                    }
                    onRemove={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Generar una tanda ------------------------------------------------------

function GeneradorTanda({
  onGenerado,
}: {
  onGenerado: (cupones: Cupon[], pct: number, nota: string) => void
}) {
  const [cantidad, setCantidad] = useState('20')
  const [pct, setPct] = useState('15')
  const [prefijo, setPrefijo] = useState('TESORO')
  const [nota, setNota] = useState('')
  const [generando, setGenerando] = useState(false)

  async function generar(e: React.FormEvent) {
    e.preventDefault()
    const cant = Number(cantidad)
    const p = Number(pct)
    if (!Number.isInteger(cant) || cant < 1) return toast.error('Ingresá cuántos cupones querés.')
    if (!Number.isInteger(p) || p < 1 || p > 100) return toast.error('El descuento va de 1 a 100.')

    setGenerando(true)
    const r = await generarTandaCupones({ cantidad: cant, pct: p, prefijo, nota })
    setGenerando(false)
    if (!r.ok) return toast.error(r.error)

    onGenerado(r.cupones, p, nota.trim())
    toast.success(`${r.cupones.length} cupones generados`)
  }

  return (
    <form onSubmit={generar} className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h2 className="font-semibold">Generar una tanda para repartir</h2>
          <p className="text-sm text-muted-foreground">
            Cada cupón sale con su propio código y sirve una sola vez: apenas alguien lo usa, ese código deja de
            andar y los demás siguen intactos. No hace falta estar suscripto para usarlos.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="tanda-cantidad">¿Cuántos?</Label>
          <Input
            id="tanda-cantidad"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="mt-1 w-24"
          />
        </div>
        <div>
          <Label htmlFor="tanda-pct">Descuento (%)</Label>
          <Input
            id="tanda-pct"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="mt-1 w-28"
          />
        </div>
        <div>
          <Label htmlFor="tanda-prefijo">Prefijo</Label>
          <Input
            id="tanda-prefijo"
            value={prefijo}
            onChange={(e) => setPrefijo(e.target.value.toUpperCase())}
            placeholder="TESORO"
            className="mt-1 w-36 uppercase"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <Label htmlFor="tanda-nota">Nota (para vos)</Label>
          <Input
            id="tanda-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: barrio, 7 de agosto"
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={generando}>
          {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Los códigos salen como <span className="font-mono">{prefijo.trim() ? `${prefijo.trim()}-K7M4Q` : 'K7M4Q'}</span>{' '}
        — sin las letras y números que se confunden al leerlos de un papel (0 y O, 1 e I).
      </p>
    </form>
  )
}

// --- Los códigos recién generados ------------------------------------------

function TandaGenerada({
  tanda,
  onCerrar,
}: {
  tanda: { codigos: string[]; pct: number; nota: string }
  onCerrar: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(tanda.codigos.join('\n'))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudieron copiar. Descargalos y abrilos en Excel.')
    }
  }

  function bajar() {
    const filas = [['Código', 'Descuento'], ...tanda.codigos.map((c) => [c, `${tanda.pct}%`])]
    descargarCsv(`cupones-tanda-${sufijoFechaArchivo()}`, armarCsv(filas))
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {tanda.codigos.length} cupones de {tanda.pct}% listos
          </h3>
          <p className="text-sm text-muted-foreground">
            Copialos o descargalos ahora para imprimirlos: es la única vez que aparecen juntos.
            {tanda.nota && <> Quedaron marcados como &laquo;{tanda.nota}&raquo;.</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copiar}>
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? 'Copiados' : 'Copiar todos'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={bajar}>
            <Download className="h-4 w-4" />
            Descargar
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onCerrar} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto rounded-md bg-muted/40 p-3 sm:grid-cols-3 md:grid-cols-4">
        {tanda.codigos.map((c) => (
          <span key={c} className="rounded bg-background px-2 py-1 text-center font-mono text-sm">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

// --- Cargar uno a mano ------------------------------------------------------

function CuponManual({ onCreado }: { onCreado: (c: Cupon) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [pct, setPct] = useState('10')
  const [unSoloUso, setUnSoloUso] = useState(false)
  const [nota, setNota] = useState('')
  const [creando, setCreando] = useState(false)

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    const p = Number(pct)
    if (!codigo.trim()) return toast.error('Escribí un código.')
    if (!Number.isInteger(p) || p < 1 || p > 100) return toast.error('El descuento va de 1 a 100.')

    setCreando(true)
    const r = await crearCupon({
      codigo: codigo.trim().toUpperCase(),
      pct: p,
      usosMaximos: unSoloUso ? 1 : null,
      requiereSuscripcion: false,
      unaVezPorEmail: false,
      nota,
    })
    setCreando(false)
    if (!r.ok) return toast.error(r.error)

    onCreado(r.cupon)
    setCodigo('')
    setNota('')
    toast.success('Cupón creado')
  }

  if (!abierto) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Plus className="h-4 w-4" />
        Cargar un cupón a mano
      </Button>
    )
  }

  return (
    <form onSubmit={crear} className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Ticket className="h-4 w-4 text-primary" />
          Cupón a mano
        </h2>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAbierto(false)} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="manual-codigo">Código</Label>
          <Input
            id="manual-codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="PRIMAVERA20"
            className="mt-1 w-48 uppercase"
          />
        </div>
        <div>
          <Label htmlFor="manual-pct">Descuento (%)</Label>
          <Input
            id="manual-pct"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="mt-1 w-28"
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="manual-nota">Nota (para vos)</Label>
          <Input
            id="manual-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: sorteo de Instagram"
            className="mt-1"
          />
        </div>
        <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unSoloUso}
            onChange={(e) => setUnSoloUso(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Un solo uso
        </label>
        <Button type="submit" disabled={creando}>
          {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sin &laquo;un solo uso&raquo;, este código lo puede usar cualquiera todas las veces que quiera — sirve para
        una promo abierta, no para repartir en papel.
      </p>
    </form>
  )
}

// --- Una fila de la lista ---------------------------------------------------

function FilaCupon({
  cupon,
  usos,
  estado,
  onPatch,
  onRemove,
}: {
  cupon: Cupon
  usos: number
  estado: EstadoCupon
  onPatch: (id: string, cambio: Partial<Cupon>) => void
  onRemove: (id: string) => void
}) {
  const [trabajando, setTrabajando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cupon.codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudo copiar.')
    }
  }

  async function toggleActivo(val: boolean) {
    setTrabajando(true)
    const r = await actualizarCupon(cupon.id, { activo: val })
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    onPatch(cupon.id, { activo: val })
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar el cupón ${cupon.codigo}? No se puede deshacer.`)) return
    setTrabajando(true)
    const r = await borrarCupon(cupon.id)
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    onRemove(cupon.id)
    toast.success('Cupón borrado')
  }

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center gap-1.5 font-mono font-medium hover:text-primary"
          title="Copiar código"
        >
          {cupon.codigo}
          {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-40" />}
        </button>
        {cupon.nota && <p className="text-xs text-muted-foreground">{cupon.nota}</p>}
      </TableCell>
      <TableCell className="font-medium">{cupon.pct}%</TableCell>
      <TableCell>
        <Badge variant={ESTADO_VARIANTE[estado]}>{ESTADO_ETIQUETA[estado]}</Badge>
        {usos > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {usos} {usos === 1 ? 'uso' : 'usos'}
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{reglaCupon(cupon)}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{fechaCorta(cupon.created_at)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={cupon.activo}
              disabled={trabajando}
              onChange={(e) => toggleActivo(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Activo
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={borrar}
            disabled={trabajando || cupon.es_bienvenida}
            title={cupon.es_bienvenida ? 'Este se manda por mail al suscribirse: apagalo en vez de borrarlo' : 'Borrar'}
            aria-label="Borrar cupón"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
