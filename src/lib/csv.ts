// Armado y descarga de CSV para las listas del panel (suscriptores, cupones).
//
// "Un excel" en la práctica es esto: un CSV que abre con doble clic en Excel
// y queda bien. Dos detalles que, si faltan, hacen que Dani vea un archivo
// roto y piense que el sistema falló:
//
//   1. El separador es punto y coma, no coma. Excel en configuración regional
//      argentina (donde la coma es el separador DECIMAL) parte las columnas
//      por `;` — con comas mete toda la fila en la celda A.
//   2. El archivo arranca con BOM (U+FEFF). Sin él, Excel asume la
//      codificación del sistema y las tildes y las ñ salen como símbolos
//      raros.
//
// El armado es puro (sin DOM) a propósito: así se puede testear y también
// usar desde el server si en algún momento hace falta.

const SEPARADOR = ';'

// Construido con fromCharCode y no pegado literal: U+FEFF es invisible, y
// escrito tal cual en el fuente no habría forma de ver que está, ni de notar
// si un editor se lo come.
const BOM = String.fromCharCode(0xfeff)

export type CeldaCsv = string | number | null | undefined

// Comillas dobles solo cuando hacen falta (separador, comillas o salto de
// línea adentro del valor), con las comillas internas duplicadas — que es
// como las espera el formato. Sin esto, un nombre como `Pérez; Ana` corre
// todas las columnas de esa fila un lugar a la derecha.
export function escaparCampoCsv(valor: CeldaCsv): string {
  if (valor == null) return ''
  const texto = String(valor)
  if (!/[";\n\r]/.test(texto)) return texto
  return `"${texto.replace(/"/g, '""')}"`
}

export function armarCsv(filas: CeldaCsv[][]): string {
  return filas.map((fila) => fila.map(escaparCampoCsv).join(SEPARADOR)).join('\r\n')
}

// Descarga desde el navegador. Solo se puede llamar desde un handler de un
// componente cliente (toca document).
export function descargarCsv(nombreArchivo: string, contenido: string): void {
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Sufijo de fecha para los nombres de archivo: 2026-08-07. Así una descarga
// nueva no pisa a la anterior en la carpeta de Descargas.
export function sufijoFechaArchivo(fecha = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`
}
