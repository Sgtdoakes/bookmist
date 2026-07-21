'use client'

import Link from 'next/link'
import { Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ImageUploader } from '@/components/admin/image-uploader'
import { EstiloEditor } from '@/components/admin/estilo-editor'
import { SelectorProductos } from '@/components/admin/selector-productos'
import type { EstiloBloque } from '@/lib/estilo-secciones'
import type { ElementoLibre, ElementoLibreTipo, ProductosFuente, SeccionTipo } from '@/lib/secciones'
import type { Categoria, Producto } from '@/types/db'

export const TIPO_LABEL: Record<SeccionTipo, string> = {
  hero: 'Portada (hero)',
  beneficios: 'Barra de beneficios',
  categorias: 'Categorías',
  mas_vendidos: 'Más vendidos',
  sobre_mi: 'Sobre mí',
  resenas: 'Reseñas',
  instagram: 'Instagram',
  texto: 'Texto',
  productos: 'Productos',
  banner: 'Banner',
  libre: 'Libre',
  catalogo: 'Catálogo con filtros',
  divisor: 'Divisor',
}

// Todos los tipos tienen estilo editable (fondo/tamaño/radio) — los 7
// "furniture" preservan su diseño original como default cuando no se elige
// nada, igual que los bloques libres. Alineación solo donde tiene un
// sentido claro de layout (encabezado o columna de texto); "beneficios" es
// una fila fija de 3 columnas y "productos"/"banner" ya tienen su propio
// layout de imagen, así que quedan afuera.
const TIPOS_CON_ESTILO: SeccionTipo[] = [
  'hero',
  'beneficios',
  'categorias',
  'mas_vendidos',
  'sobre_mi',
  'resenas',
  'instagram',
  'texto',
  'productos',
  'banner',
  'libre',
  'catalogo',
]
// "mas_vendidos" queda afuera: su encabezado comparte fila con las flechas
// de navegación del carrusel (justify-between), no tiene un alineado de
// texto simple para controlar.
const TIPOS_CON_ALINEACION: SeccionTipo[] = ['hero', 'categorias', 'sobre_mi', 'resenas', 'instagram', 'texto', 'libre']

type OnChange = (partial: Record<string, unknown>, reResolve: boolean) => void

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function BuilderInspector({
  id,
  tipo,
  config,
  productosDisponibles,
  categoriasDisponibles,
  onChange,
  onClose,
}: {
  id: string
  tipo: SeccionTipo
  config: Record<string, unknown>
  productosDisponibles: Producto[]
  categoriasDisponibles: Categoria[]
  onChange: OnChange
  onClose: () => void
}) {
  const conEstilo = TIPOS_CON_ESTILO.includes(tipo)
  const contenido = (
    <Contenido
      id={id}
      tipo={tipo}
      config={config}
      productosDisponibles={productosDisponibles}
      categoriasDisponibles={categoriasDisponibles}
      onChange={onChange}
    />
  )

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-semibold">{TIPO_LABEL[tipo]}</span>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {conEstilo ? (
        <Tabs defaultValue="contenido" className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="contenido" className="flex-1">
                Contenido
              </TabsTrigger>
              <TabsTrigger value="estilo" className="flex-1">
                Estilo
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="contenido" className="flex-1 space-y-3 overflow-y-auto p-4">
            {contenido}
          </TabsContent>
          <TabsContent value="estilo" className="flex-1 overflow-y-auto p-4">
            <EstiloEditor
              estilo={(config.estilo as EstiloBloque) ?? {}}
              onChange={(estilo) => onChange({ estilo }, false)}
              conAlineacion={TIPOS_CON_ALINEACION.includes(tipo)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto p-4">{contenido}</div>
      )}
    </aside>
  )
}

function Contenido({
  id,
  tipo,
  config,
  productosDisponibles,
  categoriasDisponibles,
  onChange,
}: {
  id: string
  tipo: SeccionTipo
  config: Record<string, unknown>
  productosDisponibles: Producto[]
  categoriasDisponibles: Categoria[]
  onChange: OnChange
}) {
  const texto = (clave: string) => String(config[clave] ?? '')

  switch (tipo) {
    case 'hero':
      return (
        <>
          <Campo label="Texto pequeño (encima del título)">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Bajada">
            <Textarea
              value={texto('subtitulo')}
              onChange={(e) => onChange({ subtitulo: e.target.value }, false)}
              className="mt-1"
              rows={2}
            />
          </Campo>
          <Campo label="Texto del botón">
            <Input value={texto('ctaTexto')} onChange={(e) => onChange({ ctaTexto: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Fotos del carrusel">
            <p className="mb-2 text-xs text-muted-foreground">
              Subí 3 o más para que se note el efecto carrusel — con 1 sola queda fija, y sin ninguna se ve el
              cartel de &quot;sin imagen&quot;. Arrastrá para cambiar el orden.
            </p>
            <ImageUploader
              carpeta="secciones"
              entidadId={id}
              portada={null}
              onPortadaChange={() => {}}
              galeria={(config.imagenes as string[]) ?? []}
              onGaleriaChange={(urls) => onChange({ imagenes: urls }, false)}
              soloGaleria
              permitirVideo
            />
          </Campo>
        </>
      )

    case 'categorias': {
      type CatItem = {
        id: string
        titulo: string
        subtitulo: string
        imagen: string | null
        categoriaSlug: string | null
        urlManual: string | null
      }
      const categorias = (config.categorias as CatItem[]) ?? []
      const set = (i: number, patch: Partial<CatItem>) =>
        onChange({ categorias: categorias.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }, false)
      const agregar = () =>
        onChange(
          {
            categorias: [
              ...categorias,
              { id: crypto.randomUUID(), titulo: '', subtitulo: '', imagen: null, categoriaSlug: null, urlManual: null },
            ],
          },
          false,
        )
      const quitar = (i: number) => onChange({ categorias: categorias.filter((_, idx) => idx !== i) }, false)
      return (
        <>
          <Campo label="Texto pequeño (encima del título)">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <div className="space-y-4 border-t pt-3">
            {categorias.map((cat, i) => (
              <div key={cat.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Card {i + 1}</Label>
                  <Button type="button" size="icon" variant="ghost" onClick={() => quitar(i)} aria-label="Quitar esta card">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <ImageUploader
                  carpeta="secciones"
                  entidadId={`${id}-cat-${cat.id}`}
                  portada={cat.imagen}
                  onPortadaChange={(url) => set(i, { imagen: url })}
                  soloPortada
                  permitirVideo
                />
                <Input value={cat.titulo} onChange={(e) => set(i, { titulo: e.target.value })} aria-label="Título de la categoría" />
                <Input
                  value={cat.subtitulo}
                  onChange={(e) => set(i, { subtitulo: e.target.value })}
                  aria-label="Subtítulo de la categoría"
                />
                <Campo label="Al hacer click, llevar a…">
                  <select
                    value={cat.categoriaSlug ?? ''}
                    onChange={(e) => set(i, { categoriaSlug: e.target.value || null })}
                    className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">— Elegí una categoría del catálogo —</option>
                    {categoriasDisponibles.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                {!cat.categoriaSlug && (
                  <Campo label="…o pegá una URL manual (se usa si no elegiste categoría)">
                    <Input
                      value={cat.urlManual ?? ''}
                      onChange={(e) => set(i, { urlManual: e.target.value || null })}
                      placeholder="/productos o https://…"
                      className="mt-1"
                    />
                  </Campo>
                )}
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={agregar}>
              <Plus className="h-4 w-4" /> Agregar categoría
            </Button>
          </div>
        </>
      )
    }

    case 'instagram': {
      type PostManual = { id: string; imagen: string | null; permalink: string }
      const posts = (config.posts as PostManual[]) ?? []
      const set = (i: number, patch: Partial<PostManual>) =>
        onChange({ posts: posts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }, false)
      const agregar = () =>
        onChange({ posts: [...posts, { id: crypto.randomUUID(), imagen: null, permalink: '' }] }, false)
      const quitar = (i: number) => onChange({ posts: posts.filter((_, idx) => idx !== i) }, false)
      return (
        <>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <div className="space-y-4 border-t pt-3">
            <Label className="text-xs font-medium text-muted-foreground">
              Posteos manuales (respaldo — se dejan de mostrar solos apenas Instagram esté conectado de verdad)
            </Label>
            {posts.map((post, i) => (
              <div key={post.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Posteo {i + 1}</Label>
                  <Button type="button" size="icon" variant="ghost" onClick={() => quitar(i)} aria-label="Quitar posteo">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <ImageUploader
                  carpeta="secciones"
                  entidadId={`${id}-ig-${post.id}`}
                  portada={post.imagen}
                  onPortadaChange={(url) => set(i, { imagen: url })}
                  soloPortada
                  permitirVideo
                />
                <Input
                  value={post.permalink}
                  onChange={(e) => set(i, { permalink: e.target.value })}
                  placeholder="https://www.instagram.com/p/..."
                  aria-label="Link al posteo real"
                />
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={agregar}>
              <Plus className="h-4 w-4" /> Agregar posteo
            </Button>
          </div>
        </>
      )
    }

    case 'sobre_mi':
      return (
        <>
          <Campo label="Texto pequeño">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Primer párrafo">
            <Textarea value={texto('texto')} onChange={(e) => onChange({ texto: e.target.value }, false)} className="mt-1" rows={3} />
          </Campo>
          <Campo label="Segundo párrafo">
            <Textarea value={texto('texto2')} onChange={(e) => onChange({ texto2: e.target.value }, false)} className="mt-1" rows={3} />
          </Campo>
          <Campo label="Firma">
            <Input value={texto('firma')} onChange={(e) => onChange({ firma: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Foto">
            <div className="mt-1">
              <ImageUploader
                carpeta="secciones"
                entidadId={id}
                portada={(config.imagen as string | null) ?? null}
                onPortadaChange={(url) => onChange({ imagen: url }, false)}
                soloPortada
                permitirVideo
              />
            </div>
          </Campo>
        </>
      )

    case 'beneficios': {
      const items = (config.items as { emoji: string; texto: string }[]) ?? []
      const set = (i: number, patch: Partial<{ emoji: string; texto: string }>) =>
        onChange({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }, false)
      const agregar = () => onChange({ items: [...items, { emoji: '✨', texto: '' }] }, false)
      const quitar = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) }, false)
      return (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={it.emoji} onChange={(e) => set(i, { emoji: e.target.value })} className="w-14 text-center" aria-label="Emoji" />
              <Input
                value={it.texto}
                onChange={(e) => set(i, { texto: e.target.value })}
                className="flex-1"
                aria-label="Texto del beneficio"
              />
              <Button type="button" size="icon" variant="ghost" onClick={() => quitar(i)} aria-label="Quitar">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={agregar}>
            <Plus className="h-4 w-4" /> Agregar beneficio
          </Button>
        </div>
      )
    }

    case 'resenas': {
      const items = (config.items as { nombre: string; texto: string }[]) ?? []
      const set = (i: number, patch: Partial<{ nombre: string; texto: string }>) =>
        onChange({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }, false)
      const agregar = () => onChange({ items: [...items, { nombre: '', texto: '' }] }, false)
      const quitar = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) }, false)
      return (
        <>
          <Campo label="Texto pequeño">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <div className="space-y-3 border-t pt-3">
            {items.map((it, i) => (
              <div key={i} className="space-y-1.5 rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Input value={it.nombre} onChange={(e) => set(i, { nombre: e.target.value })} placeholder="Nombre" className="flex-1" />
                  <Button type="button" size="icon" variant="ghost" onClick={() => quitar(i)} aria-label="Quitar reseña">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Textarea value={it.texto} onChange={(e) => set(i, { texto: e.target.value })} placeholder="Texto de la reseña" rows={2} />
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={agregar}>
              <Plus className="h-4 w-4" /> Agregar reseña
            </Button>
          </div>
        </>
      )
    }

    case 'catalogo':
      return (
        <>
          <Campo label="Texto pequeño (encima del título)">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <p className="text-xs text-muted-foreground">
            El buscador, el orden, el rango de precios y las secciones por categoría son parte del
            bloque — se arman solos con los productos y categorías del catálogo.{' '}
            <Link href="/admin/productos" className="underline underline-offset-2 hover:text-foreground">
              ¿Querés renombrar una categoría? Se hace desde Catálogo de productos.
            </Link>
          </p>
        </>
      )

    case 'texto':
      return (
        <>
          <Campo label="Texto pequeño (encima del título)">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Texto">
            <Textarea value={texto('texto')} onChange={(e) => onChange({ texto: e.target.value }, false)} className="mt-1" rows={4} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Texto del botón (opcional)">
              <Input value={texto('ctaTexto')} onChange={(e) => onChange({ ctaTexto: e.target.value }, false)} className="mt-1" />
            </Campo>
            <Campo label="Link del botón">
              <Input
                value={texto('ctaHref')}
                onChange={(e) => onChange({ ctaHref: e.target.value }, false)}
                placeholder="/productos"
                className="mt-1"
              />
            </Campo>
          </div>
        </>
      )

    case 'banner':
      return (
        <>
          <Campo label="Imagen de fondo">
            <div className="mt-1">
              <ImageUploader
                carpeta="secciones"
                entidadId={id}
                portada={(config.imagen as string | null) ?? null}
                onPortadaChange={(url) => onChange({ imagen: url }, false)}
                soloPortada
                permitirVideo
              />
            </div>
          </Campo>
          <Campo label="Texto pequeño">
            <Input value={texto('eyebrow')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Título">
            <Input value={texto('titulo')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
          </Campo>
          <Campo label="Texto">
            <Textarea value={texto('texto')} onChange={(e) => onChange({ texto: e.target.value }, false)} className="mt-1" rows={2} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Texto del botón (opcional)">
              <Input value={texto('ctaTexto')} onChange={(e) => onChange({ ctaTexto: e.target.value }, false)} className="mt-1" />
            </Campo>
            <Campo label="Link del botón">
              <Input
                value={texto('ctaHref')}
                onChange={(e) => onChange({ ctaHref: e.target.value }, false)}
                placeholder="/productos"
                className="mt-1"
              />
            </Campo>
          </div>
        </>
      )

    case 'mas_vendidos':
    case 'productos':
      return (
        <ContenidoProductos
          config={config}
          productosDisponibles={productosDisponibles}
          categoriasDisponibles={categoriasDisponibles}
          onChange={onChange}
        />
      )

    case 'libre':
      return <ContenidoLibre id={id} config={config} onChange={onChange} />

    case 'divisor':
      return (
        <p className="text-xs text-muted-foreground">
          Este bloque no tiene contenido — solo agrega la línea separadora entre los bloques de arriba y de abajo.
        </p>
      )
  }
}

function ContenidoProductos({
  config,
  productosDisponibles,
  categoriasDisponibles,
  onChange,
}: {
  config: Record<string, unknown>
  productosDisponibles: Producto[]
  categoriasDisponibles: Categoria[]
  onChange: OnChange
}) {
  const fuente = (config.fuente as ProductosFuente) ?? 'destacados'
  const categoria = String(config.categoria ?? '')
  const productos = (config.productos as string[]) ?? []
  const limite = String(config.limite ?? 8)

  return (
    <>
      <Campo label="Texto pequeño (encima del título)">
        <Input value={String(config.eyebrow ?? '')} onChange={(e) => onChange({ eyebrow: e.target.value }, false)} className="mt-1" />
      </Campo>
      <Campo label="Título">
        <Input value={String(config.titulo ?? '')} onChange={(e) => onChange({ titulo: e.target.value }, false)} className="mt-1" />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Qué mostrar">
          <select
            value={fuente}
            onChange={(e) => onChange({ fuente: e.target.value as ProductosFuente }, true)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="todos">Todos los productos activos</option>
            <option value="destacados">Destacados</option>
            <option value="novedades">Novedades (últimos cargados)</option>
            <option value="categoria">Una categoría puntual</option>
            <option value="manual">Elegidos a mano</option>
          </select>
        </Campo>
        <Campo label="Cantidad máxima">
          <Input
            type="number"
            min={1}
            value={limite}
            onChange={(e) => onChange({ limite: Math.max(1, Number(e.target.value) || 8) }, true)}
            className="mt-1"
          />
        </Campo>
      </div>

      {fuente === 'categoria' && (
        <Campo label="Categoría">
          <select
            value={categoria}
            onChange={(e) => onChange({ categoria: e.target.value }, true)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Elegí una categoría…</option>
            {categoriasDisponibles.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
        <Campo label="Texto del botón (vacío = sin botón)">
          <Input
            value={String(config.ctaTexto ?? '')}
            onChange={(e) => onChange({ ctaTexto: e.target.value }, false)}
            placeholder="Ver más"
            className="mt-1"
          />
        </Campo>
        <Campo label="Link del botón">
          <Input
            value={String(config.ctaHref ?? '')}
            onChange={(e) => onChange({ ctaHref: e.target.value }, false)}
            placeholder="/productos"
            className="mt-1"
          />
        </Campo>
      </div>

      {fuente === 'manual' && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Elegí productos <span className="font-normal">(el orden se cambia arrastrando las fichas en el lienzo)</span>
          </p>
          <SelectorProductos
            productosDisponibles={productosDisponibles}
            value={productos}
            onChange={(ids) => onChange({ productos: ids }, true)}
          />
        </div>
      )}
    </>
  )
}

const ELEMENTOS_LIBRE: { tipo: ElementoLibreTipo; label: string }[] = [
  { tipo: 'titulo', label: '+ Título' },
  { tipo: 'parrafo', label: '+ Párrafo' },
  { tipo: 'imagen', label: '+ Imagen' },
  { tipo: 'boton', label: '+ Botón' },
  { tipo: 'espacio', label: '+ Espacio' },
]

function elementoPorDefecto(tipo: ElementoLibreTipo): ElementoLibre {
  const id = crypto.randomUUID()
  switch (tipo) {
    case 'titulo':
      return { id, tipo, texto: 'Título' }
    case 'parrafo':
      return { id, tipo, texto: 'Escribí acá…' }
    case 'imagen':
      return { id, tipo, url: null }
    case 'boton':
      return { id, tipo, texto: 'Ver más', href: '/productos' }
    case 'espacio':
      return { id, tipo, alto: 'md' }
  }
}

function ContenidoLibre({ id, config, onChange }: { id: string; config: Record<string, unknown>; onChange: OnChange }) {
  const elementos = (config.elementos as ElementoLibre[]) ?? []

  function set(elId: string, patch: Partial<ElementoLibre>) {
    onChange(
      { elementos: elementos.map((el) => (el.id === elId ? ({ ...el, ...patch } as ElementoLibre) : el)) },
      false,
    )
  }
  function agregar(tipo: ElementoLibreTipo) {
    onChange({ elementos: [...elementos, elementoPorDefecto(tipo)] }, false)
  }
  function quitar(elId: string) {
    onChange({ elementos: elementos.filter((el) => el.id !== elId) }, false)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Reordená arrastrando las piezas en el lienzo. Acá editás el contenido de cada una.
      </p>
      {elementos.map((el) => (
        <div key={el.id} className="space-y-1.5 rounded-lg border p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{el.tipo}</span>
            <Button type="button" size="icon" variant="ghost" onClick={() => quitar(el.id)} aria-label="Quitar elemento">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          {(el.tipo === 'titulo' || el.tipo === 'parrafo') && (
            <Textarea value={el.texto} onChange={(e) => set(el.id, { texto: e.target.value })} rows={el.tipo === 'titulo' ? 1 : 3} />
          )}
          {el.tipo === 'imagen' && (
            <ImageUploader
              carpeta="secciones"
              entidadId={id}
              portada={el.url}
              onPortadaChange={(url) => set(el.id, { url })}
              soloPortada
              permitirVideo
            />
          )}
          {el.tipo === 'boton' && (
            <div className="space-y-1.5">
              <Input value={el.texto} onChange={(e) => set(el.id, { texto: e.target.value })} placeholder="Texto del botón" />
              <Input value={el.href} onChange={(e) => set(el.id, { href: e.target.value })} placeholder="/productos" />
            </div>
          )}
          {el.tipo === 'espacio' && (
            <select
              value={el.alto}
              onChange={(e) => set(el.id, { alto: e.target.value as 'sm' | 'md' | 'lg' })}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="sm">Chico</option>
              <option value="md">Medio</option>
              <option value="lg">Grande</option>
            </select>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {ELEMENTOS_LIBRE.map((e) => (
          <Button key={e.tipo} type="button" size="sm" variant="outline" onClick={() => agregar(e.tipo)}>
            {e.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
