// El cuerpo de una nota del blog es texto plano con tres marcas mínimas, que
// el panel escribe con botones (Dani no tiene que memorizar nada):
//
//   ## Subtítulo              → un renglón que empieza con "## "
//   **negrita**
//   [texto](/productos/slug)  → link (a un producto, o a cualquier https://)
//   - ítem                    → un bloque donde todos los renglones empiezan con "- "
//
// Una línea en blanco separa bloques, igual que la descripción de un producto
// (separarEnParrafos). Esto devuelve una estructura, no HTML: la dibuja React
// (src/components/public/cuerpo-nota.tsx), que escapa todo — no hay forma de
// colar un <script> escribiendo en el cuerpo.

import { separarEnParrafos } from '@/lib/format'

export type Inline =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'negrita'; texto: string }
  | { tipo: 'link'; texto: string; href: string; externo: boolean }

export type BloqueCuerpo =
  | { tipo: 'subtitulo'; contenido: Inline[] }
  | { tipo: 'parrafo'; contenido: Inline[] }
  | { tipo: 'lista'; items: Inline[][] }

// Solo rutas del propio sitio ("/productos/...") o http(s). Un
// "javascript:alert(1)" o un "//otro-sitio.com" no pasan: el link se dibuja
// como texto común.
export function hrefSeguro(href: string): { href: string; externo: boolean } | null {
  const h = href.trim()
  if (h.startsWith('/') && !h.startsWith('//')) return { href: h, externo: false }
  if (/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(h)) return { href: h, externo: true }
  return null
}

const MARCAS_INLINE = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g

export function parsearInline(texto: string): Inline[] {
  const partes: Inline[] = []
  let desde = 0
  const agregarTexto = (t: string) => {
    if (!t) return
    const ultima = partes[partes.length - 1]
    // Un link rechazado vuelve como texto: se pega al texto de al lado en vez
    // de quedar como pedazo suelto.
    if (ultima?.tipo === 'texto') ultima.texto += t
    else partes.push({ tipo: 'texto', texto: t })
  }

  for (const m of texto.matchAll(MARCAS_INLINE)) {
    agregarTexto(texto.slice(desde, m.index))
    if (m[1] !== undefined) {
      partes.push({ tipo: 'negrita', texto: m[1] })
    } else {
      const destino = hrefSeguro(m[3])
      if (destino) partes.push({ tipo: 'link', texto: m[2], ...destino })
      else agregarTexto(m[2])
    }
    desde = m.index + m[0].length
  }
  agregarTexto(texto.slice(desde))
  return partes
}

export function parsearCuerpo(cuerpo: string | null | undefined): BloqueCuerpo[] {
  return separarEnParrafos(cuerpo).map((bloque): BloqueCuerpo => {
    if (bloque.startsWith('## ')) {
      return { tipo: 'subtitulo', contenido: parsearInline(bloque.slice(3).replace(/\s+/g, ' ').trim()) }
    }
    const renglones = bloque.split(/\r?\n/).map((r) => r.trim())
    if (renglones.every((r) => r.startsWith('- '))) {
      return { tipo: 'lista', items: renglones.map((r) => parsearInline(r.slice(2).trim())) }
    }
    return { tipo: 'parrafo', contenido: parsearInline(bloque) }
  })
}

// El cuerpo sin marcas, para contar palabras (tiempo de lectura) y como
// descripción de reserva si la nota no tiene bajada.
export function textoPlanoDelCuerpo(cuerpo: string | null | undefined): string {
  // Los pedazos de un mismo renglón se pegan sin espacio (el texto ya trae los
  // suyos); entre bloques e ítems de lista sí va uno.
  const unir = (partes: Inline[]) => partes.map((i) => i.texto).join('')
  return parsearCuerpo(cuerpo)
    .flatMap((b) => (b.tipo === 'lista' ? b.items.map(unir) : [unir(b.contenido)]))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ~200 palabras por minuto, que es la cuenta que usa todo el mundo. Mínimo 1:
// "0 min de lectura" no significa nada.
export function minutosDeLectura(cuerpo: string | null | undefined): number {
  const palabras = textoPlanoDelCuerpo(cuerpo).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(palabras / 200))
}
