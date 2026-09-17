// Contrato de datos del catálogo de Martín Libros y su validación. Vive
// separado de src/lib/catalogo-ml.ts —que es `server-only` porque lleva el
// token— para que el formulario del panel (componente cliente) pueda usar el
// tipo y para poder testear la validación sin red. Mismo patrón que la
// separación cupon.ts / cupon-codigo.ts.

import { limpiarTextoExterno } from '@/lib/texto-externo'

// Lo que promete devolver el servicio de Martín Libros
// (su src/lib/catalogo-externo.ts). Es un contrato, no el reflejo de su tabla:
// si allá cambian el esquema, lo arreglan allá.
export type LibroDeML = {
  isbn: string | null
  titulo: string
  autor: string | null
  editorial: string | null
  descripcion: string | null
  tapa: string | null
  precio: number
}

// Lo que llega es JSON de otro servicio: se valida campo por campo en vez de
// confiar. Un resultado sin título no sirve para nada, así que se descarta.
export function normalizarLibros(raw: unknown): LibroDeML[] {
  if (!Array.isArray(raw)) return []
  const libros: LibroDeML[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const l = item as Record<string, unknown>
    const titulo = typeof l.titulo === 'string' ? l.titulo.trim() : ''
    if (!titulo) continue
    libros.push({
      isbn: texto(l.isbn),
      // Los textos del 5GL vienen con entidades HTML crudas ("pasion&#8230;"),
      // y esto termina en la ficha que lee un cliente.
      titulo: limpiarTextoExterno(titulo) ?? titulo,
      autor: limpiarTextoExterno(texto(l.autor)),
      editorial: limpiarTextoExterno(texto(l.editorial)),
      descripcion: limpiarTextoExterno(texto(l.descripcion)),
      tapa: urlDeImagen(l.tapa),
      precio: typeof l.precio === 'number' && Number.isFinite(l.precio) ? l.precio : 0,
    })
  }
  return libros
}

function texto(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const limpio = v.trim()
  return limpio || null
}

// Solo https: la tapa termina en `imagen_principal` y se sirve en el sitio
// público. Un http:// ahí sería contenido mixto, y cualquier otra cosa
// (javascript:, data:) no tiene por qué entrar a la base.
function urlDeImagen(v: unknown): string | null {
  const url = texto(v)
  if (!url) return null
  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
  }
}
