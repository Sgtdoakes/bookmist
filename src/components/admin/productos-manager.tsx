'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Producto, ProductoTipo } from '@/types/db'
import { actualizarProducto, borrarProducto } from '@/app/admin/productos/actions'

const TIPO_LABEL: Record<ProductoTipo, string> = { caja: 'Caja', kit: 'Kit' }

export function ProductosManager({ productosIniciales }: { productosIniciales: Producto[] }) {
  const [items, setItems] = useState<Producto[]>(productosIniciales)

  function patch(id: string, cambio: Partial<Producto>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambio } : p)))
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Todavía no hay productos cargados.
      </p>
    )
  }

  return (
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
          {items.map((p) => (
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
  )
}

function FilaProducto({
  producto: p,
  onPatch,
  onRemove,
}: {
  producto: Producto
  onPatch: (id: string, patch: Partial<Producto>) => void
  onRemove: (id: string) => void
}) {
  const [precio, setPrecio] = useState(String(p.precio))
  const [stock, setStock] = useState(String(p.stock))
  const [guardando, setGuardando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)

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

  async function toggle(field: 'activo' | 'destacado', val: boolean) {
    setTrabajando(true)
    const patchLocal = field === 'activo' ? { activo: val } : { destacado: val }
    const r = await actualizarProducto(p.id, patchLocal)
    setTrabajando(false)
    if (r.ok) onPatch(p.id, patchLocal)
    else toast.error(r.error)
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
        <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted/30">
          {p.imagen_principal && (
            <Image src={p.imagen_principal} alt="" fill sizes="40px" className="object-cover" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <p className="font-medium">{p.nombre}</p>
        <Badge variant="secondary" className="mt-0.5">
          {TIPO_LABEL[p.tipo]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{p.categoria ?? '—'}</TableCell>
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
          onChange={(e) => toggle('activo', e.target.checked)}
          className="size-4"
          aria-label="Visible"
        />
      </TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={p.destacado}
          disabled={trabajando}
          onChange={(e) => toggle('destacado', e.target.checked)}
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
