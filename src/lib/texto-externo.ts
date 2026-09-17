// Limpieza del texto que llega de afuera (catálogo de Martín Libros, Google
// Books, OpenLibrary) antes de guardarlo como descripción de un producto.
//
// Hace falta porque esos textos vienen de catálogos y APIs que los guardan como
// HTML: las descripciones del 5GL traen entidades crudas ("Amistad, rivalidad y
// pasion&#8230;") y las de Google Books traen etiquetas (<p>, <br>). React
// escapa todo lo que renderiza, así que sin esto el cliente lee literalmente
// "pasion&#8230;" y "<p>" en la ficha del libro.
//
// No es un sanitizador de HTML ni pretende serlo: el texto se muestra como
// texto (nunca con dangerouslySetInnerHTML), así que acá no hay superficie de
// XSS que cerrar. Es una cuestión de que se lea bien.

// Las que aparecen de verdad en estos catálogos. El resto de las nombradas se
// dejan como están: inventar una tabla de 2000 entidades para un caso que no
// pasa es peor que no hacerlo.
const ENTIDADES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
}

export function limpiarTextoExterno(valor: string | null | undefined): string | null {
  if (typeof valor !== 'string') return null

  const sinEtiquetas = valor
    // <br> y </p> son saltos de párrafo reales: si se borran a secas, la
    // descripción entera queda en un bloque sin respirar.
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')

  const decodificado = sinEtiquetas
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => desdeCodigo(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => desdeCodigo(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (entero, nombre: string) => ENTIDADES[nombre.toLowerCase()] ?? entero)

  // Máximo dos saltos seguidos: separarEnParrafos ya usa la línea en blanco
  // como separador, y tres o más solo abren huecos en la ficha.
  const normalizado = decodificado.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return normalizado || null
}

// Un código inválido (o uno que no corresponde a un carácter) se deja pasar
// como string vacío en vez de romper el texto entero.
function desdeCodigo(codigo: number): string {
  if (!Number.isFinite(codigo) || codigo < 1 || codigo > 0x10ffff) return ''
  try {
    return String.fromCodePoint(codigo)
  } catch {
    return ''
  }
}
