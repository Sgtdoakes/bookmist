// Parte pura de la ficha de libro: limpiar/validar un ISBN y darle forma
// legible a los datos. Vive separado de src/lib/isbn.ts —que hace fetch a
// Google Books/OpenLibrary— porque el formulario del panel es un componente
// cliente y necesita estas funciones sin arrastrar el módulo de red.
// Mismo patrón que la separación cupon.ts / cupon-codigo.ts.

export function limpiarIsbn(raw: string): string {
  return (raw ?? '').replace(/[^0-9Xx]/g, '').toUpperCase()
}

// ISBN-10 (9 dígitos + dígito o X) o ISBN-13 (13 dígitos). No verifica el
// dígito de control: el objetivo es atajar el dedazo evidente antes de salir a
// buscar, no rechazar un ISBN real mal calculado por la editorial.
export function esIsbnPlausible(raw: string): boolean {
  const isbn = limpiarIsbn(raw)
  return /^[0-9]{9}[0-9X]$/.test(isbn) || /^[0-9]{13}$/.test(isbn)
}

// Las fechas vienen en cualquier formato: "2020", "2020-05", "2020-05-01",
// "May 01, 2020". Lo único que se guarda es el año.
export function anioDe(fecha: unknown): number | null {
  if (typeof fecha !== 'string') return null
  const match = /(\d{4})/.exec(fecha)
  if (!match) return null
  const anio = Number(match[1])
  return anio >= 1000 && anio <= 2200 ? anio : null
}

// El campo `idioma` se muestra tal cual en la ficha pública, así que un "es"
// pelado no sirve. Intl traduce el código a nombre en castellano sin tener que
// mantener una tabla propia. Si Intl devuelve el mismo código que entró, es que
// no lo reconoció: mejor null que mostrar "Zz".
// El camino inverso, para el JSON-LD: schema.org pide un código BCP 47 en
// inLanguage ("es"), no el nombre que se muestra en la ficha ("Español"). Solo
// resuelve los idiomas que este catálogo puede tener; para cualquier otra cosa
// devuelve null y el dato se omite, que es mejor que emitir algo inválido.
const CODIGOS: Record<string, string> = {
  español: 'es',
  castellano: 'es',
  inglés: 'en',
  ingles: 'en',
  portugués: 'pt',
  portugues: 'pt',
  francés: 'fr',
  frances: 'fr',
  italiano: 'it',
  alemán: 'de',
  aleman: 'de',
  catalán: 'ca',
  catalan: 'ca',
  japonés: 'ja',
  japones: 'ja',
}

export function codigoDeIdioma(nombre: string | null): string | null {
  if (!nombre) return null
  return CODIGOS[nombre.trim().toLowerCase()] ?? null
}

export function nombreDeIdioma(codigo: unknown): string | null {
  if (typeof codigo !== 'string' || !codigo.trim()) return null
  try {
    const nombre = new Intl.DisplayNames(['es'], { type: 'language' }).of(codigo.trim())
    if (!nombre || nombre.toLowerCase() === codigo.trim().toLowerCase()) return null
    return nombre.charAt(0).toUpperCase() + nombre.slice(1)
  } catch {
    return null
  }
}
