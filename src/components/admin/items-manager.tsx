'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ImageUploader } from '@/components/admin/image-uploader'
import { itemFormSchema, type ItemFormInput, type ItemFormOutput } from '@/lib/validations'
import { formatARS } from '@/lib/format'
import type { ItemCatalogo, ItemTipo } from '@/types/db'
import {
  crearItem,
  actualizarItem,
  borrarItem,
  getProductosQueUsanItem,
  agregarItemAProducto,
  quitarItemDeProducto,
  type ProductoQueUsaItem,
  type ProductoOpcion,
} from '@/app/admin/items/actions'

const TIPO_LABEL: Record<ItemTipo, string> = { libro: 'Libro', accesorio: 'Accesorio' }

export function ItemsManager({
  itemsIniciales,
  productosDisponibles,
}: {
  itemsIniciales: ItemCatalogo[]
  productosDisponibles: ProductoOpcion[]
}) {
  const [items, setItems] = useState<ItemCatalogo[]>(itemsIniciales)
  const [busqueda, setBusqueda] = useState('')
  const [itemAbierto, setItemAbierto] = useState<ItemCatalogo | null>(null)
  const [tipo, setTipo] = useState<ItemTipo>('libro')
  const [nombre, setNombre] = useState('')
  const [autor, setAutor] = useState('')
  const [creando, setCreando] = useState(false)

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.nombre.toLowerCase().includes(q) || i.autor?.toLowerCase().includes(q))
  }, [items, busqueda])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return toast.error('Ingresá un nombre.')
    setCreando(true)
    const r = await crearItem({ tipo, nombre, autor: tipo === 'libro' ? autor : null })
    setCreando(false)
    if (!r.ok) return toast.error(r.error)
    setItems((prev) => [...prev, r.item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
    setNombre('')
    setAutor('')
    toast.success('Ítem agregado — abrilo para cargar fotos, precio y stock')
  }

  function onPatch(id: string, patch: Partial<ItemCatalogo>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
    setItemAbierto((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev))
  }

  function onRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setItemAbierto((prev) => (prev?.id === id ? null : prev))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div>
          <Label htmlFor="tipo-nuevo">Tipo</Label>
          <select
            id="tipo-nuevo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ItemTipo)}
            className="mt-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="libro">Libro</option>
            <option value="accesorio">Accesorio</option>
          </select>
        </div>
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="nombre-nuevo">Nombre</Label>
          <Input id="nombre-nuevo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1" />
        </div>
        {tipo === 'libro' && (
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="autor-nuevo">Autor</Label>
            <Input id="autor-nuevo" value={autor} onChange={(e) => setAutor(e.target.value)} className="mt-1" />
          </div>
        )}
        <Button type="submit" disabled={creando}>
          {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar
        </Button>
      </form>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o autor…"
          className="pl-8"
        />
      </div>

      {itemsFiltrados.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {items.length === 0 ? 'Todavía no hay ítems cargados.' : 'Ningún ítem coincide con la búsqueda.'}
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsFiltrados.map((item) => (
                <FilaItem key={item.id} item={item} onAbrir={() => setItemAbierto(item)} onRemove={onRemove} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {itemAbierto && (
        <ItemDetailDialog
          item={itemAbierto}
          productosDisponibles={productosDisponibles}
          onClose={() => setItemAbierto(null)}
          onPatch={onPatch}
        />
      )}
    </div>
  )
}

function FilaItem({
  item,
  onAbrir,
  onRemove,
}: {
  item: ItemCatalogo
  onAbrir: () => void
  onRemove: (id: string) => void
}) {
  const [borrando, setBorrando] = useState(false)

  async function borrar() {
    if (!window.confirm(`¿Borrar "${item.nombre}"? No se puede deshacer.`)) return
    setBorrando(true)
    const r = await borrarItem(item.id)
    setBorrando(false)
    if (!r.ok) return toast.error(r.error)
    onRemove(item.id)
    toast.success('Ítem borrado')
  }

  return (
    <TableRow>
      <TableCell>
        <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted/30">
          {item.imagen && <Image src={item.imagen} alt="" fill sizes="40px" className="object-cover" />}
        </div>
      </TableCell>
      <TableCell>
        <button type="button" onClick={onAbrir} className="text-left font-medium hover:underline">
          {item.nombre}
        </button>
        {item.autor && <p className="text-xs text-muted-foreground">{item.autor}</p>}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{TIPO_LABEL[item.tipo]}</Badge>
      </TableCell>
      <TableCell>{item.precio != null ? formatARS(item.precio) : '—'}</TableCell>
      <TableCell>{item.stock ?? '—'}</TableCell>
      <TableCell>
        <Badge variant={item.activo ? 'default' : 'outline'}>{item.activo ? 'Sí' : 'No'}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="outline" size="icon-sm" onClick={onAbrir} aria-label="Editar ítem">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={borrar}
            disabled={borrando}
            aria-label="Borrar ítem"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function ItemDetailDialog({
  item,
  productosDisponibles,
  onClose,
  onPatch,
}: {
  item: ItemCatalogo
  productosDisponibles: ProductoOpcion[]
  onClose: () => void
  onPatch: (id: string, patch: Partial<ItemCatalogo>) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      tipo: item.tipo,
      nombre: item.nombre,
      autor: item.autor ?? '',
      descripcion: item.descripcion ?? '',
      precio: item.precio ?? undefined,
      stock: item.stock ?? undefined,
      activo: item.activo,
    },
  })
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(values: ItemFormOutput) {
    setGuardando(true)
    const patch = {
      nombre: values.nombre.trim(),
      autor: values.autor?.trim() || null,
      descripcion: values.descripcion?.trim() || null,
      precio: values.precio ?? null,
      stock: values.stock ?? null,
      activo: values.activo,
    }
    const r = await actualizarItem(item.id, patch)
    setGuardando(false)
    if (!r.ok) return toast.error(r.error)
    onPatch(item.id, patch)
    toast.success('Guardado')
  }

  async function onPortadaChange(url: string | null) {
    const r = await actualizarItem(item.id, { imagen: url })
    if (!r.ok) return toast.error(r.error)
    onPatch(item.id, { imagen: url })
  }

  async function onGaleriaChange(urls: string[]) {
    const r = await actualizarItem(item.id, { imagenes_galeria: urls })
    if (!r.ok) return toast.error(r.error)
    onPatch(item.id, { imagenes_galeria: urls })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.nombre}</DialogTitle>
        </DialogHeader>

        <ImageUploader
          carpeta="items"
          entidadId={item.id}
          portada={item.imagen}
          galeria={item.imagenes_galeria ?? []}
          onPortadaChange={onPortadaChange}
          onGaleriaChange={onGaleriaChange}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input id="edit-nombre" {...register('nombre')} className="mt-1" />
              {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            {item.tipo === 'libro' && (
              <div>
                <Label htmlFor="edit-autor">Autor</Label>
                <Input id="edit-autor" {...register('autor')} className="mt-1" />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="edit-descripcion">Descripción</Label>
            <Textarea id="edit-descripcion" {...register('descripcion')} className="mt-1" rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="edit-precio">Precio</Label>
              <Input id="edit-precio" type="number" step="0.01" {...register('precio')} className="mt-1" />
              {errors.precio && <p className="mt-1 text-xs text-destructive">{errors.precio.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-stock">Stock</Label>
              <Input id="edit-stock" type="number" {...register('stock')} className="mt-1" />
              {errors.stock && <p className="mt-1 text-xs text-destructive">{errors.stock.message}</p>}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('activo')} className="size-4" />
                Disponible
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={guardando || !isDirty}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>

        <PertenenciaKits itemId={item.id} productosDisponibles={productosDisponibles} />
      </DialogContent>
    </Dialog>
  )
}

function PertenenciaKits({
  itemId,
  productosDisponibles,
}: {
  itemId: string
  productosDisponibles: ProductoOpcion[]
}) {
  const [productos, setProductos] = useState<ProductoQueUsaItem[] | null>(null)
  const [productoElegido, setProductoElegido] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [agregando, setAgregando] = useState(false)

  useEffect(() => {
    let cancelado = false
    getProductosQueUsanItem(itemId).then((r) => {
      if (!cancelado) setProductos(r)
    })
    return () => {
      cancelado = true
    }
  }, [itemId])

  const disponiblesParaAgregar = useMemo(
    () => productosDisponibles.filter((p) => !productos?.some((pq) => pq.producto_id === p.id)),
    [productosDisponibles, productos],
  )

  async function agregar() {
    if (!productoElegido) return
    setAgregando(true)
    const r = await agregarItemAProducto(productoElegido, itemId, cantidad)
    setAgregando(false)
    if (!r.ok) return toast.error(r.error)
    const producto = productosDisponibles.find((p) => p.id === productoElegido)
    if (producto) {
      setProductos((prev) => [
        ...(prev ?? []),
        { producto_id: producto.id, producto_nombre: producto.nombre, producto_slug: '', cantidad },
      ])
    }
    setProductoElegido('')
    setCantidad(1)
    toast.success('Agregado al producto')
  }

  async function quitar(productoId: string) {
    const r = await quitarItemDeProducto(productoId, itemId)
    if (!r.ok) return toast.error(r.error)
    setProductos((prev) => prev?.filter((p) => p.producto_id !== productoId) ?? null)
    toast.success('Quitado del producto')
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <h3 className="font-semibold">Aparece en estos kits/cajas</h3>
      {productos === null ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : productos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no forma parte de ningún producto.</p>
      ) : (
        <ul className="space-y-1.5">
          {productos.map((p) => (
            <li key={p.producto_id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {p.producto_nombre} <span className="text-muted-foreground">× {p.cantidad}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => quitar(p.producto_id)}
                aria-label={`Quitar de ${p.producto_nombre}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {disponiblesParaAgregar.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="producto-elegido">Agregar a un producto</Label>
            <select
              id="producto-elegido"
              value={productoElegido}
              onChange={(e) => setProductoElegido(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Elegí un producto…</option>
              {disponiblesParaAgregar.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <Label htmlFor="cantidad-elegida">Cant.</Label>
            <Input
              id="cantidad-elegida"
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
              className="mt-1"
            />
          </div>
          <Button type="button" size="sm" onClick={agregar} disabled={!productoElegido || agregando}>
            {agregando ? 'Agregando…' : 'Agregar'}
          </Button>
        </div>
      )}
    </div>
  )
}
