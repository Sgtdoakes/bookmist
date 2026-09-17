// Datos de un libro a partir de su ISBN, con APIs gratuitas y sin API key:
// Google Books primero, OpenLibrary de reserva.
//
// Convive con el buscador del catálogo de Martín Libros (src/lib/catalogo-ml.ts)
// y no lo reemplaza: ML tiene precio de referencia, editorial normalizada y
// tapa ya alojada, pero su tabla NO guarda páginas, año ni idioma. Esos tres
// salen de acá. Para un libro que no esté en el catálogo de ML, esto es lo
// único que hay.
//
// Estado de los dos proveedores, medido el 2026-09-17 (y por eso el código no
// es el mismo que el de Martín Libros, de donde salió):
//   * Google Books sin API key responde 429 "Quota exceeded" — el cupo diario
//     es compartido entre todos los que consultan sin credencial, así que se
//     agota solo. Por eso `sin_cupo` es un resultado propio y no un "no
//     existe": son cosas distintas para quien está cargando un libro.
//   * El endpoint clásico de OpenLibrary (/api/books?bibkeys=...) devuelve 404
//     para CUALQUIER ISBN, incluso los que OpenLibrary tiene. El que anda es
//     /isbn/<isbn>.json, que redirige a la edición. Martín Libros todavía usa
//     el viejo: su autocompletar por ISBN viene fallando en silencio.
//
// NO se trae la tapa de acá a propósito, aunque las dos APIs devuelvan una:
// son miniaturas de ~128 px y esta es la foto principal de un producto en una
// tienda que cuida cómo se ve. La tapa buena sale del catálogo de Martín
// Libros (que las sirve desde R2) o la sube Dani. De paso, evita abrir el CSP
// a dos dominios más.

import { anioDe, limpiarIsbn, nombreDeIdioma } from '@/lib/isbn-formato'
import { limpiarTextoExterno } from '@/lib/texto-externo'

export type MotivoIsbn = 'no_encontrado' | 'sin_cupo' | 'error'

export type DatosDeIsbn = {
  isbn: string
  titulo: string | null
  autor: string | null
  editorial: string | null
  descripcion: string | null
  paginas: number | null
  anio: number | null
  idioma: string | null
  encontrado: boolean
  fuente: 'google' | 'openlibrary' | null
  // Solo cuando encontrado = false: por qué no hay datos.
  motivo: MotivoIsbn | null
}

const TIMEOUT_MS = 8000

function paginasDe(valor: unknown): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}

function vacio(isbn: string, motivo: MotivoIsbn): DatosDeIsbn {
  return {
    isbn,
    titulo: null,
    autor: null,
    editorial: null,
    descripcion: null,
    paginas: null,
    anio: null,
    idioma: null,
    encontrado: false,
    fuente: null,
    motivo,
  }
}

export async function buscarPorIsbn(isbnRaw: string): Promise<DatosDeIsbn> {
  const isbn = limpiarIsbn(isbnRaw)
  if (!isbn) return vacio('', 'no_encontrado')

  const google = await enGoogle(isbn)
  if (google && google !== 'sin_cupo') return google

  const openLibrary = await enOpenLibrary(isbn)
  if (openLibrary) return openLibrary

  // Sin cupo en Google y sin suerte en OpenLibrary no es lo mismo que "ese
  // ISBN no existe": el panel dice una cosa u otra según esto.
  return vacio(isbn, google === 'sin_cupo' ? 'sin_cupo' : 'no_encontrado')
}

async function enGoogle(isbn: string): Promise<DatosDeIsbn | 'sin_cupo' | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (res.status === 429 || res.status === 403) {
      console.error(`Google Books rechazó el ISBN ${isbn} con ${res.status}: cupo de la API pública agotado.`)
      return 'sin_cupo'
    }
    if (!res.ok) {
      console.error(`Google Books respondió ${res.status} al ISBN ${isbn}.`)
      return null
    }

    const data = await res.json()
    const v = data?.items?.[0]?.volumeInfo
    if (!v) return null

    return {
      isbn,
      titulo: limpiarTextoExterno(v.title),
      autor: Array.isArray(v.authors) ? v.authors.join(', ') : null,
      editorial: limpiarTextoExterno(v.publisher),
      // Las descripciones de Google Books vienen con etiquetas HTML (<p>, <br>).
      descripcion: limpiarTextoExterno(v.description),
      paginas: paginasDe(v.pageCount),
      anio: anioDe(v.publishedDate),
      idioma: nombreDeIdioma(v.language),
      encontrado: true,
      fuente: 'google',
      motivo: null,
    }
  } catch (e) {
    console.error(`La consulta a Google Books por el ISBN ${isbn} falló`, e)
    return null
  }
}

type EdicionOL = {
  title?: string
  publishers?: unknown
  description?: unknown
  number_of_pages?: unknown
  publish_date?: unknown
  languages?: { key?: string }[]
  authors?: { key?: string }[]
}

async function enOpenLibrary(isbn: string): Promise<DatosDeIsbn | null> {
  try {
    // /isbn/<isbn>.json redirige (302) a la edición; sin seguir el redirect no
    // hay datos. Un 404 acá significa que OpenLibrary no tiene ese ISBN.
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status === 404) return null
    if (!res.ok) {
      console.error(`OpenLibrary respondió ${res.status} al ISBN ${isbn}.`)
      return null
    }

    const v = (await res.json()) as EdicionOL
    if (!v?.title) return null

    return {
      isbn,
      titulo: v.title,
      autor: await nombresDeAutores(v.authors),
      editorial: Array.isArray(v.publishers)
        ? v.publishers.filter((p): p is string => typeof p === 'string').join(', ') || null
        : null,
      descripcion: descripcionDe(v.description),
      paginas: paginasDe(v.number_of_pages),
      anio: anioDe(v.publish_date),
      // Viene como /languages/spa — código de tres letras, que Intl entiende.
      idioma: nombreDeIdioma(v.languages?.[0]?.key?.split('/').pop()),
      encontrado: true,
      fuente: 'openlibrary',
      motivo: null,
    }
  } catch (e) {
    console.error(`La consulta a OpenLibrary por el ISBN ${isbn} falló`, e)
    return null
  }
}

// La edición trae los autores como referencias (/authors/OL123A), así que el
// nombre es una consulta más por cabeza. Se cortan en dos: un libro con más
// autores que eso no los muestra a todos en la ficha igual.
async function nombresDeAutores(autores: { key?: string }[] | undefined): Promise<string | null> {
  if (!Array.isArray(autores) || autores.length === 0) return null
  const claves = autores.map((a) => a?.key).filter((k): k is string => !!k).slice(0, 2)
  if (claves.length === 0) return null

  const nombres = await Promise.all(
    claves.map(async (clave) => {
      try {
        const res = await fetch(`https://openlibrary.org${clave}.json`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!res.ok) return null
        const autor = await res.json()
        return typeof autor?.name === 'string' ? autor.name : null
      } catch {
        return null
      }
    }),
  )

  const encontrados = nombres.filter((n): n is string => !!n)
  return encontrados.length > 0 ? encontrados.join(', ') : null
}

// OpenLibrary devuelve la descripción como string o como { value }, según la
// antigüedad del registro.
function descripcionDe(descripcion: unknown): string | null {
  if (typeof descripcion === 'string') return limpiarTextoExterno(descripcion)
  if (descripcion && typeof descripcion === 'object' && 'value' in descripcion) {
    const value = (descripcion as { value?: unknown }).value
    return typeof value === 'string' ? limpiarTextoExterno(value) : null
  }
  return null
}
