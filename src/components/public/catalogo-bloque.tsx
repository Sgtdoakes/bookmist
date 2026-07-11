import { getCatalogo, getCategorias } from '@/lib/productos'
import { CatalogoInteractivo } from '@/components/public/catalogo-interactivo'
import type { CatalogoConfig } from '@/lib/secciones'
import type { Categoria, ProductoConCategorias } from '@/types/db'

// Resuelve los datos del bloque "catálogo" — separado del render para poder
// alimentar también el lienzo en vivo del admin (previewSecciones), igual
// que resolverProductosBloque.
export async function resolverCatalogoBloque(): Promise<{
  productos: ProductoConCategorias[]
  categorias: Categoria[]
}> {
  const [productos, categorias] = await Promise.all([getCatalogo(), getCategorias()])
  return { productos, categorias }
}

export async function CatalogoBloque({ eyebrow, titulo, estilo }: CatalogoConfig) {
  const { productos, categorias } = await resolverCatalogoBloque()
  return (
    <CatalogoInteractivo
      eyebrow={eyebrow}
      titulo={titulo}
      productos={productos}
      categorias={categorias}
      estilo={estilo}
    />
  )
}
