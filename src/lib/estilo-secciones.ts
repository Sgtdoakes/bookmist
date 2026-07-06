// Sistema de estilo para bloques de página (Fase 6c) — mismo patrón que
// `estilo-secciones.ts` en Martín Libros (paleta + tamaño + radio +
// alineación con resolvers), pero acotado a la única paleta de marca de
// Bookmist (`globals.css`) en vez de una lista abierta de colores: acá no
// hay tema claro/oscuro que elegir, así que las opciones son variaciones de
// contraste dentro de esa misma paleta, no colores arbitrarios.

export type ColorFondo = 'oscuro' | 'medio' | 'claro' | 'tarjeta' | 'transparente'
export type Tamano = 'sm' | 'md' | 'lg'
export type Radio = 'ninguno' | 'sm' | 'md' | 'lg'
export type Alineacion = 'izquierda' | 'centro' | 'derecha'

export type EstiloBloque = {
  fondo?: ColorFondo
  tamano?: Tamano
  radio?: Radio
  alineacion?: Alineacion
}

export const FONDO_LABEL: Record<ColorFondo, string> = {
  oscuro: 'Violeta oscuro',
  medio: 'Violeta medio',
  claro: 'Lila suave',
  tarjeta: 'Tarjeta blanca',
  transparente: 'Sin fondo',
}

const FONDO_CLASES: Record<ColorFondo, string> = {
  oscuro: 'bg-background text-foreground',
  medio: 'bg-primary text-primary-foreground',
  claro: 'bg-muted text-card-foreground',
  tarjeta: 'bg-card text-card-foreground',
  transparente: '',
}

export const TAMANO_LABEL: Record<Tamano, string> = { sm: 'Chico', md: 'Medio', lg: 'Grande' }

const TAMANO_CLASES: Record<Tamano, { padding: string; titulo: string; texto: string }> = {
  sm: { padding: 'py-10 md:py-14', titulo: 'text-2xl md:text-3xl', texto: 'text-sm' },
  md: { padding: 'py-16 md:py-24', titulo: 'text-3xl md:text-4xl', texto: 'text-base' },
  lg: { padding: 'py-24 md:py-32', titulo: 'text-4xl md:text-5xl', texto: 'text-lg' },
}

export const RADIO_LABEL: Record<Radio, string> = { ninguno: 'Ninguno', sm: 'Chico', md: 'Medio', lg: 'Grande' }

const RADIO_CLASES: Record<Radio, string> = {
  ninguno: 'rounded-none',
  sm: 'rounded-lg',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
}

export const ALINEACION_LABEL: Record<Alineacion, string> = {
  izquierda: 'Izquierda',
  centro: 'Centro',
  derecha: 'Derecha',
}

const ALINEACION_CLASES: Record<Alineacion, { texto: string; items: string }> = {
  izquierda: { texto: 'text-left', items: 'items-start' },
  centro: { texto: 'text-center', items: 'items-center' },
  derecha: { texto: 'text-right', items: 'items-end' },
}

export function resolverFondo(estilo?: EstiloBloque): string {
  return FONDO_CLASES[estilo?.fondo ?? 'transparente']
}

export function resolverTamano(estilo?: EstiloBloque) {
  return TAMANO_CLASES[estilo?.tamano ?? 'md']
}

export function resolverRadio(estilo?: EstiloBloque): string {
  return RADIO_CLASES[estilo?.radio ?? 'ninguno']
}

export function resolverAlineacion(estilo?: EstiloBloque) {
  return ALINEACION_CLASES[estilo?.alineacion ?? 'centro']
}
