'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/admin/image-uploader'
import { SelectorItems } from '@/components/admin/selector-items'
import { generarSlug } from '@/lib/slugs'
import {
  actualizarProducto,
  crearCategoria,
  crearProducto,
  guardarCategoriasProducto,
  guardarContenidoProducto,
  type ContenidoInput,
} from '@/app/admin/productos/actions'
import type { Categoria, Producto, ProductoConItems, ProductoTipo } from '@/types/db'

type Props = {
  producto?: ProductoConItems
  itemsDisponibles: Producto[]
  categoriasDisponibles: Categoria[]
}

const TIPO_OPCIONES: { value: ProductoTipo; label: string }[] = [
  { value: 'caja', label: 'Caja (libros + accesorios)' },
  { value: 'kit', label: 'Kit (solo accesorios)' },
  { value: 'libro', label: 'Libro' },
  { value: 'accesorio', label: 'Accesorio suelto' },
]

export function ProductoForm({ producto, itemsDisponibles, categoriasDisponibles }: Props) {
  const router = useRouter()
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [slug, setSlug] = useState(producto?.slug ?? '')
  const [slugTocado, setSlugTocado] = useState(!!producto)
  const [tipo, setTipo] = useState<ProductoTipo>(producto?.tipo ?? 'caja')
  const [autor, setAutor] = useState(producto?.autor ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [precio, setPrecio] = useState(String(producto?.precio ?? 0))
  const [stock, setStock] = useState(String(producto?.stock ?? 0))
  const [activo, setActivo] = useState(producto?.activo ?? true)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasDisponibles)
  const [categoriaIds, setCategoriaIds] = useState<string[]>(
    () => producto?.categorias?.map((c) => c.id) ?? [],
  )
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [imagenPrincipal, setImagenPrincipal] = useState<string | null>(producto?.imagen_principal ?? null)
  const [imagenesGaleria, setImagenesGaleria] = useState<string[]>(producto?.imagenes_galeria ?? [])
  const [guardando, setGuardando] = useState(false)

  const [cantidades, setCantidades] = useState<Record<string, number>>(() => {
    const inicial: Record<string, number> = {}
    for (const pi of producto?.producto_items ?? []) inicial[pi.item_id] = pi.cantidad
    return inicial
  })

  function onNombreChange(v: string) {
    setNombre(v)
    if (!slugTocado) setSlug(generarSlug(v))
  }

  function toggleCategoria(id: string, checked: boolean) {
    setCategoriaIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  async function onCrearCategoria() {
    if (!nuevaCategoria.trim()) return
    setCreandoCategoria(true)
    const r = await crearCategoria(nuevaCategoria)
    setCreandoCategoria(false)
    if (!r.ok) return toast.error(r.error)
    setCategorias((prev) => [...prev, r.categoria])
    setCategoriaIds((prev) => [...prev, r.categoria.id])
    setNuevaCategoria('')
    toast.success(`Categoría "${r.categoria.nombre}" creada`)
  }

  function toggleItem(id: string, checked: boolean) {
    setCantidades((prev) => {
      const next = { ...prev }
      if (checked) next[id] = next[id] ?? 1
      else delete next[id]
      return next
    })
  }

  async function onPortadaChange(url: string | null) {
    if (!producto) return
    const r = await actualizarProducto(producto.id, { imagen_principal: url })
    if (!r.ok) return toast.error(r.error)
    setImagenPrincipal(url)
  }

  async function onGaleriaChange(urls: string[]) {
    if (!producto) return
    const r = await actualizarProducto(producto.id, { imagenes_galeria: urls })
    if (!r.ok) return toast.error(r.error)
    setImagenesGaleria(urls)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return toast.error('El nombre es obligatorio.')
    if (!slug.trim()) return toast.error('El slug es obligatorio.')

    setGuardando(true)
    const datos = {
      nombre: nombre.trim(),
      slug: slug.trim(),
      tipo,
      autor: autor.trim() || null,
      descripcion: descripcion.trim() || null,
      precio: Number(precio),
      stock: Number(stock),
      activo,
    }

    let id: string
    if (producto) {
      const resultado = await actualizarProducto(producto.id, datos)
      if (!resultado.ok) {
        setGuardando(false)
        toast.error(resultado.error)
        return
      }
      id = producto.id
    } else {
      const resultado = await crearProducto(datos)
      if (!resultado.ok) {
        setGuardando(false)
        toast.error(resultado.error)
        return
      }
      id = resultado.id
    }

    const rCategorias = await guardarCategoriasProducto(id, categoriaIds)
    if (!rCategorias.ok) {
      setGuardando(false)
      toast.error(rCategorias.error)
      return
    }

    const contenido: ContenidoInput = Object.entries(cantidades).map(([item_id, cantidad]) => ({
      item_id,
      cantidad,
    }))
    const rContenido = await guardarContenidoProducto(id, contenido)
    setGuardando(false)
    if (!rContenido.ok) {
      toast.error(rContenido.error)
      return
    }

    toast.success(producto ? 'Producto actualizado' : 'Producto creado')
    if (producto) {
      router.push('/admin/productos')
    } else {
      // Recién creado: va a la ficha completa para poder cargar fotos ya mismo.
      router.push(`/admin/productos/${id}`)
    }
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {producto && (
        <div>
          <Label className="mb-1 block">Fotos</Label>
          <ImageUploader
            carpeta="productos"
            entidadId={producto.id}
            portada={imagenPrincipal}
            galeria={imagenesGaleria}
            onPortadaChange={onPortadaChange}
            onGaleriaChange={onGaleriaChange}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTocado(true)
              setSlug(e.target.value)
            }}
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ProductoTipo)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {TIPO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {tipo === 'libro' && (
          <div>
            <Label htmlFor="autor">Autor</Label>
            <Input
              id="autor"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className="mt-1"
            />
          </div>
        )}
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="size-4"
            />
            Visible
          </label>
        </div>
      </div>

      <div>
        <Label className="mb-1 block">Categorías</Label>
        <p className="text-sm text-muted-foreground">
          Un producto puede estar en varias — &quot;Destacados&quot; lo muestra también en la vidriera
          de la home.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoriaIds.includes(c.id)}
                onChange={(e) => toggleCategoria(c.id, e.target.checked)}
                className="size-4"
              />
              {c.nombre}
            </label>
          ))}
        </div>
        <div className="mt-3 flex max-w-sm gap-2">
          <Input
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onCrearCategoria()
              }
            }}
            placeholder="Nueva categoría…"
            className="h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCrearCategoria}
            disabled={creandoCategoria || !nuevaCategoria.trim()}
          >
            {creandoCategoria ? 'Creando…' : 'Crear'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="precio">Precio</Label>
          <Input
            id="precio"
            type="number"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <h2 className="font-semibold">Qué incluye</h2>
        <p className="text-sm text-muted-foreground">
          Elegí los productos del catálogo que van dentro de esta caja/kit.
        </p>

        {itemsDisponibles.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay otros productos en el catálogo —{' '}
            <Link href="/admin/productos/nuevo" className="underline">
              cargá alguno primero
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3">
            <SelectorItems
              itemsDisponibles={itemsDisponibles}
              cantidades={cantidades}
              onToggle={toggleItem}
              onCantidad={(id, c) => setCantidades((prev) => ({ ...prev, [id]: c }))}
            />
          </div>
        )}
      </div>

      <Button type="submit" size="lg" disabled={guardando}>
        {guardando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
      </Button>
    </form>
  )
}
