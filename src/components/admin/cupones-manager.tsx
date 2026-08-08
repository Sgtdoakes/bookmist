'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Loader2, Pencil, Plus, Search, Sparkles, Ticket, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { armarCsv, descargarCsv, sufijoFechaArchivo } from '@/lib/csv'
import { estadoCupon, reglaCupon, usosRestantes, type EstadoCupon } from '@/lib/cupon-codigo'
import type { Cupon } from '@/types/db'
import {
  borrarCupon,
  borrarCupones,
  crearCupon,
  editarCupon,
  generarTandaCupones,
  toggleActivoCupon,
} from '@/app/admin/cupones/actions'

const ESTADO_ETIQUETA: Record<EstadoCupon, string> = {
  disponible: 'Sin usar',
  usado: 'En uso',
  agotado: 'Agotado',
  apagado: 'Apagado',
}

const ESTADO_VARIANTE: Record<EstadoCupon, 'default' | 'secondary' | 'outline'> = {
  disponible: 'default',
  usado: 'default',
  agotado: 'secondary',
  apagado: 'outline',
}

type Filtro = 'todos' | 'vivos' | 'muertos'

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Los usos vienen indexados por id del cupón (orders.cupon_id), no por
// código: desde que los códigos se pueden editar, contar por texto hacía que
// renombrar un cupón le reseteara la cuenta.
function usosDe(cupon: Cupon, usos: Record<string, number>): number {
  return usos[cupon.id] ?? 0
}

export function CuponesManager({
  cuponesIniciales,
  usosIniciales,
}: {
  cuponesIniciales: Cupon[]
  usosIniciales: Record<string, number>
}) {
  const [items, setItems] = useState<Cupon[]>(cuponesIniciales)
  const usos = usosIniciales

  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editando, setEditando] = useState<Cupon | null>(null)
  const [ultimaTanda, setUltimaTanda] = useState<{ codigos: string[]; pct: number; nota: string } | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toUpperCase()
    return items.filter((c) => {
      if (q && !c.codigo.toUpperCase().includes(q) && !(c.nota ?? '').toUpperCase().includes(q)) return false
      const estado = estadoCupon(c, usosDe(c, usos))
      if (filtro === 'vivos') return estado === 'disponible' || estado === 'usado'
      if (filtro === 'muertos') return estado === 'agotado' || estado === 'apagado'
      return true
    })
  }, [items, busqueda, filtro, usos])

  const agotados = useMemo(
    () => items.filter((c) => !c.es_bienvenida && estadoCupon(c, usosDe(c, usos)) === 'agotado'),
    [items, usos],
  )

  function patch(cupon: Cupon) {
    setItems((prev) => prev.map((x) => (x.id === cupon.id ? cupon : x)))
  }

  function bajarCsvLista() {
    const filas = [
      ['Código', 'Descuento', 'Estado', 'Usados', 'Quedan', 'Regla', 'Nota', 'Creado'],
      ...filtrados.map((c) => {
        const u = usosDe(c, usos)
        const quedan = usosRestantes(c, u)
        return [
          c.codigo,
          `${c.pct}%`,
          ESTADO_ETIQUETA[estadoCupon(c, u)],
          u,
          quedan ?? 'sin tope',
          reglaCupon(c),
          c.nota ?? '',
          fechaCorta(c.created_at),
        ]
      }),
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
      <CuponForm
        modo="crear"
        onGuardado={(c) => setItems((prev) => [c, ...prev])}
      />

      <GeneradorTanda
        onGenerado={(nuevos, pct, nota) => {
          setUltimaTanda({ codigos: nuevos.map((c) => c.codigo), pct, nota })
          setItems((prev) => [...nuevos, ...prev])
        }}
      />

      {ultimaTanda && <TandaGenerada tanda={ultimaTanda} onCerrar={() => setUltimaTanda(null)} />}

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
                placeholder="Código o nota…"
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
            Todavía no hay cupones cargados.
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
                  <TableHead>Usados</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Regla</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => (
                  <FilaCupon
                    key={c.id}
                    cupon={c}
                    usos={usosDe(c, usos)}
                    onEditar={() => setEditando(c)}
                    onPatch={patch}
                    onRemove={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent className="sm:max-w-xl" showCloseButton>
          <DialogTitle>Editar cupón</DialogTitle>
          {editando && (
            <CuponForm
              modo="editar"
              cupon={editando}
              usados={usosDe(editando, usos)}
              onGuardado={(c) => {
                patch(c)
                setEditando(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Alta y edición comparten formulario -----------------------------------
// Mismos campos y mismas reglas en los dos lados: que un cupón se pueda crear
// con algo que después la edición rechaza sería desconcertante.

function CuponForm({
  modo,
  cupon,
  usados = 0,
  onGuardado,
}: {
  modo: 'crear' | 'editar'
  cupon?: Cupon
  usados?: number
  onGuardado: (c: Cupon) => void
}) {
  const [abierto, setAbierto] = useState(modo === 'editar')
  const [codigo, setCodigo] = useState(cupon?.codigo ?? '')
  const [pct, setPct] = useState(String(cupon?.pct ?? 10))
  const [conTope, setConTope] = useState(cupon ? cupon.usos_maximos != null : true)
  const [usosMax, setUsosMax] = useState(String(cupon?.usos_maximos ?? 30))
  const [conTopePersona, setConTopePersona] = useState(cupon ? cupon.usos_maximos_por_email != null : false)
  const [porPersona, setPorPersona] = useState(String(cupon?.usos_maximos_por_email ?? 1))
  const [requiereSusc, setRequiereSusc] = useState(cupon?.requiere_suscripcion ?? false)
  const [nota, setNota] = useState(cupon?.nota ?? '')
  const [guardando, setGuardando] = useState(false)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const datos = {
      codigo: codigo.trim().toUpperCase(),
      pct: Number(pct),
      usosMaximos: conTope ? Number(usosMax) : null,
      usosMaximosPorEmail: conTopePersona ? Number(porPersona) : null,
      requiereSuscripcion: requiereSusc,
      nota,
    }

    setGuardando(true)
    const r = modo === 'editar' && cupon ? await editarCupon(cupon.id, datos) : await crearCupon(datos)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)

    onGuardado(r.cupon)
    if (modo === 'crear') {
      setCodigo('')
      setNota('')
      setAbierto(false)
    }
    toast.success(modo === 'editar' ? 'Cupón guardado' : 'Cupón creado')
  }

  if (!abierto) {
    return (
      <Button type="button" variant="outline" onClick={() => setAbierto(true)}>
        <Plus className="h-4 w-4" />
        Cargar un cupón
      </Button>
    )
  }

  const topeMenorQueUsados = conTope && Number(usosMax) < usados

  return (
    <form onSubmit={guardar} className={modo === 'crear' ? 'space-y-4 rounded-lg border bg-muted/30 p-4' : 'space-y-4'}>
      {modo === 'crear' && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Ticket className="h-4 w-4 text-primary" />
            Cupón nuevo
          </h2>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAbierto(false)} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor={`${modo}-codigo`}>Código</Label>
          <Input
            id={`${modo}-codigo`}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="BIENVENIDOS"
            className="mt-1 w-52 font-mono uppercase"
          />
        </div>
        <div>
          <Label htmlFor={`${modo}-pct`}>Descuento (%)</Label>
          <Input
            id={`${modo}-pct`}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="mt-1 w-28"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <Label htmlFor={`${modo}-nota`}>Nota (para vos)</Label>
          <Input
            id={`${modo}-nota`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: papeles del barrio, 7 de agosto"
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={conTope}
            onChange={(e) => setConTope(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Limitar cuántas veces se puede usar en total
        </label>
        {conTope && (
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={usosMax}
              onChange={(e) => setUsosMax(e.target.value)}
              className="h-9 w-24"
              aria-label="Cantidad total de usos"
            />
            <span className="text-sm text-muted-foreground">
              usos en total{modo === 'editar' && ` — ya lleva ${usados}`}
            </span>
          </div>
        )}
        {topeMenorQueUsados && (
          <p className="pl-6 text-sm text-amber-500">
            Ese número es menor que los {usados} usos que ya tiene: el cupón va a quedar agotado al guardar.
          </p>
        )}
        <p className="pl-6 text-xs text-muted-foreground">
          Si imprimiste 30 papeles con el mismo código, poné 30: al trigésimo pedido el cupón se apaga solo.
        </p>
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={conTopePersona}
            onChange={(e) => setConTopePersona(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Limitar cuántas veces lo puede usar una misma persona
        </label>
        {conTopePersona && (
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={porPersona}
              onChange={(e) => setPorPersona(e.target.value)}
              className="h-9 w-24"
              aria-label="Máximo por persona"
            />
            <span className="text-sm text-muted-foreground">veces por mail</span>
          </div>
        )}
        <p className="pl-6 text-xs text-muted-foreground">
          Con un código repetido en varios papeles, el papel no prueba cuántos tiene cada uno. Esto acota al vivo sin
          romperle el pedido a quien de verdad juntó dos.
          {conTopePersona && (
            <>
              {' '}
              <strong>Ojo:</strong> para contar por persona hace falta saber quién es, así que el cliente va a tener
              que completar su email antes de poder aplicar el cupón.
            </>
          )}
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={requiereSusc}
          onChange={(e) => setRequiereSusc(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Solo para quienes se suscribieron con ese mismo mail
      </label>

      {cupon?.es_bienvenida && (
        <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          Este es el que se manda por mail a quien se suscribe desde el popup del sitio. Si le cambiás el código, los
          mails nuevos van a llevar el código nuevo — los ya enviados siguen diciendo el viejo.
        </p>
      )}

      <Button type="submit" disabled={guardando}>
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {modo === 'editar' ? 'Guardar cambios' : 'Crear cupón'}
      </Button>
    </form>
  )
}

// --- Generar códigos únicos ------------------------------------------------

function GeneradorTanda({
  onGenerado,
}: {
  onGenerado: (cupones: Cupon[], pct: number, nota: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [cantidad, setCantidad] = useState('20')
  const [pct, setPct] = useState('10')
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
    toast.success(`${r.cupones.length} códigos generados`)
  }

  if (!abierto) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setAbierto(true)}>
        <Sparkles className="h-4 w-4" />
        …o generar códigos únicos, uno distinto por papel
      </Button>
    )
  }

  return (
    <form onSubmit={generar} className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold">Códigos únicos, uno por papel</h2>
            <p className="text-sm text-muted-foreground">
              Cada papel lleva un código distinto y sirve una sola vez, así nadie puede usar más de los que tiene en la
              mano. <strong>Solo sirve si imprimís cada código por separado</strong> — si vas a hacer una tirada de N
              copias iguales, usá &laquo;Cargar un cupón&raquo; con cantidad de usos.
            </p>
          </div>
        </div>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAbierto(false)} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
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
            placeholder="Ej: tesoro barrio"
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={generando}>
          {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Salen como <span className="font-mono">{prefijo.trim() ? `${prefijo.trim()}-K7M4Q` : 'K7M4Q'}</span> — sin las
        letras y números que se confunden al leerlos de un papel (0 y O, 1 e I).
      </p>
    </form>
  )
}

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
            {tanda.codigos.length} códigos de {tanda.pct}% listos
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

// --- Una fila de la lista ---------------------------------------------------

function FilaCupon({
  cupon,
  usos,
  onEditar,
  onPatch,
  onRemove,
}: {
  cupon: Cupon
  usos: number
  onEditar: () => void
  onPatch: (c: Cupon) => void
  onRemove: (id: string) => void
}) {
  const [trabajando, setTrabajando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const estado = estadoCupon(cupon, usos)
  const quedan = usosRestantes(cupon, usos)

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
    const r = await toggleActivoCupon(cupon.id, val)
    setTrabajando(false)
    if (!r.ok) return toast.error(r.error)
    onPatch({ ...cupon, activo: val })
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
        {cupon.usos_maximos != null ? (
          <span className="font-medium">
            {usos} <span className="text-muted-foreground">de {cupon.usos_maximos}</span>
            {quedan != null && quedan > 0 && (
              <span className="block text-xs text-muted-foreground">quedan {quedan}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{usos} · sin tope</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={ESTADO_VARIANTE[estado]}>{ESTADO_ETIQUETA[estado]}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{reglaCupon(cupon)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <label className="mr-1 flex cursor-pointer items-center gap-1.5 text-sm">
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
            onClick={onEditar}
            title="Editar"
            aria-label={`Editar cupón ${cupon.codigo}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={borrar}
            disabled={trabajando || cupon.es_bienvenida}
            title={cupon.es_bienvenida ? 'Este se manda por mail al suscribirse: apagalo en vez de borrarlo' : 'Borrar'}
            aria-label={`Borrar cupón ${cupon.codigo}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
