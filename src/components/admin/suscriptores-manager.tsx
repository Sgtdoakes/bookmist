'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { armarCsv, descargarCsv, sufijoFechaArchivo } from '@/lib/csv'
import type { SuscriptorNewsletter } from '@/types/db'

// Mismo criterio de búsqueda que el resto del panel: sin tildes ni
// mayúsculas, así "martin" encuentra a "Martín".
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SuscriptoresManager({
  suscriptoresIniciales,
}: {
  suscriptoresIniciales: SuscriptorNewsletter[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [copiado, setCopiado] = useState(false)

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return suscriptoresIniciales
    return suscriptoresIniciales.filter(
      (s) =>
        normalizar(s.email).includes(q) ||
        normalizar(s.nombre).includes(q) ||
        normalizar(s.provincia ?? '').includes(q),
    )
  }, [suscriptoresIniciales, busqueda])

  function bajarCsv() {
    // Se baja lo que está a la vista: si Dani filtró por provincia para
    // armar una campaña, el archivo tiene que traer eso y no la lista entera.
    const filas = [
      ['Email', 'Nombre', 'Cumpleaños', 'Provincia', 'Fecha de alta'],
      ...filtrados.map((s) => [s.email, s.nombre, s.cumpleanos ?? '', s.provincia ?? '', fechaCorta(s.created_at)]),
    ]
    descargarCsv(`suscriptores-${sufijoFechaArchivo()}`, armarCsv(filas))
  }

  async function copiarMails() {
    try {
      await navigator.clipboard.writeText(filtrados.map((s) => s.email).join(', '))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudieron copiar. Probá con la descarga.')
    }
  }

  if (suscriptoresIniciales.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Todavía no se suscribió nadie desde el popup del sitio.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <Label htmlFor="susc-busqueda" className="text-xs text-muted-foreground">
            Buscar
          </Label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="susc-busqueda"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Mail, nombre o provincia…"
              className="pl-8"
            />
          </div>
        </div>
        <Button type="button" onClick={bajarCsv} disabled={filtrados.length === 0}>
          <Download className="h-4 w-4" />
          Descargar para Excel
        </Button>
        <Button type="button" variant="outline" onClick={copiarMails} disabled={filtrados.length === 0}>
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? 'Copiados' : 'Copiar los mails'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {busqueda.trim()
          ? `${filtrados.length} de ${suscriptoresIniciales.length} suscriptos`
          : `${suscriptoresIniciales.length} ${suscriptoresIniciales.length === 1 ? 'suscripto' : 'suscriptos'}`}
      </p>

      {filtrados.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Nadie coincide con esa búsqueda.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Cumpleaños</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Se suscribió</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>{s.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{s.cumpleanos ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.provincia ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{fechaCorta(s.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
