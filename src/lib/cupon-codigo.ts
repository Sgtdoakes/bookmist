import { METODO_PAGO_CORTO } from '@/lib/constants'
import type { Cupon } from '@/types/db'

// Parte pura de los cupones: formato de los códigos y en qué estado está uno.
// Vive separado de src/lib/cupon.ts (que es 'server-only' porque consulta la
// base) para que el panel, que es un componente cliente, pueda pintar el
// estado de cada fila sin arrastrar el cliente de Supabase al navegador.

// Alfabeto de los códigos generados en tanda: sin 0/O ni 1/I/L. Los cupones
// se imprimen y se tipean a mano desde un papel — un 0 que alguien lee como
// O es un cupón que "no anda" y una consulta por WhatsApp que Dani tiene que
// contestar. Todo mayúsculas por el mismo motivo.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LARGO_CODIGO = 5

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase()
}

// Un código solo puede tener letras, números y guiones. Se chequea antes de
// ir a la base porque las búsquedas usan `ilike`, donde % y _ son comodines:
// sin esto, alguien que tipea "%" en el campo de cupón haría match contra el
// primer cupón activo de la tabla y se llevaría el descuento sin conocer
// ningún código.
const CODIGO_VALIDO = /^[A-Z0-9][A-Z0-9-]*$/

export function codigoBienFormado(codigo: string): boolean {
  return CODIGO_VALIDO.test(normalizarCodigo(codigo))
}

// Un código aleatorio con prefijo opcional: TESORO-K7M4Q. El prefijo es para
// que se lea como algo y no como un serial (y para distinguir tandas de un
// vistazo); la parte aleatoria es la que lo hace único.
export function generarCodigo(prefijo: string): string {
  let sufijo = ''
  const bytes = crypto.getRandomValues(new Uint8Array(LARGO_CODIGO))
  for (const b of bytes) sufijo += ALFABETO[b % ALFABETO.length]
  const base = normalizarCodigo(prefijo).replace(/[^A-Z0-9]/g, '')
  return base ? `${base}-${sufijo}` : sufijo
}

// Cuántos códigos distintos hay en total con este alfabeto y largo: 31^5 ≈
// 28,6 millones. Para tandas de decenas de cupones las colisiones son
// rarísimas, pero igual se descartan y se reintenta, porque el unique de la
// tabla las rechazaría y la tanda saldría corta sin avisar.
//
// `yaExistentes` se muta a propósito: sirve de acumulador entre las
// iteraciones, así dos códigos de la MISMA tanda tampoco pueden repetirse.
export function generarCodigosUnicos(cantidad: number, prefijo: string, yaExistentes: Set<string>): string[] {
  const nuevos: string[] = []
  let intentos = 0
  const techo = cantidad * 20 + 50
  while (nuevos.length < cantidad && intentos < techo) {
    intentos++
    const codigo = generarCodigo(prefijo)
    if (yaExistentes.has(codigo)) continue
    yaExistentes.add(codigo)
    nuevos.push(codigo)
  }
  return nuevos
}

export type EstadoCupon = 'apagado' | 'agotado' | 'usado' | 'disponible'

// Cómo se ve un cupón en la lista del panel, a partir de cuántos pedidos lo
// usaron. La diferencia entre "usado" y "agotado" importa: con
// usos_maximos = 1 el primer uso ya lo mata, pero un cupón de 30 usos puede
// llevar 12 y seguir sirviendo perfectamente.
export function estadoCupon(cupon: Pick<Cupon, 'activo' | 'usos_maximos'>, usos: number): EstadoCupon {
  if (!cupon.activo) return 'apagado'
  if (cupon.usos_maximos != null && usos >= cupon.usos_maximos) return 'agotado'
  return usos > 0 ? 'usado' : 'disponible'
}

// Cuántos quedan, para el "12 de 30" de la lista. null = sin tope, no hay
// nada que contar hacia atrás.
export function usosRestantes(cupon: Pick<Cupon, 'usos_maximos'>, usos: number): number | null {
  if (cupon.usos_maximos == null) return null
  return Math.max(0, cupon.usos_maximos - usos)
}

// La regla del cupón en una línea, para la columna del panel. Es lo que le
// dice a Dani de un vistazo si un cupón es de los impresos, el de mail, o
// una promo abierta.
export function reglaCupon(
  c: Pick<
    Cupon,
    | 'es_bienvenida'
    | 'usos_maximos'
    | 'usos_maximos_por_email'
    | 'requiere_suscripcion'
    | 'metodo_pago_requerido'
  >,
): string {
  const partes: string[] = []
  if (c.usos_maximos == null) partes.push('Usos ilimitados')
  else if (c.usos_maximos === 1) partes.push('Un solo uso')
  else partes.push(`${c.usos_maximos} usos`)

  if (c.usos_maximos_por_email === 1) partes.push('uno por persona')
  else if (c.usos_maximos_por_email != null) partes.push(`hasta ${c.usos_maximos_por_email} por persona`)

  if (c.metodo_pago_requerido) partes.push(`solo con ${METODO_PAGO_CORTO[c.metodo_pago_requerido]}`)
  if (c.requiere_suscripcion) partes.push('solo suscriptos')
  if (c.es_bienvenida) partes.push('se manda por mail')

  return partes.join(' · ')
}
