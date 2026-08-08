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
// usos_maximos = 1 (el de la búsqueda del tesoro) el primer uso ya lo mata,
// pero un cupón sin tope puede tener 20 usos y seguir sirviendo.
export function estadoCupon(cupon: Pick<Cupon, 'activo' | 'usos_maximos'>, usos: number): EstadoCupon {
  if (!cupon.activo) return 'apagado'
  if (cupon.usos_maximos != null && usos >= cupon.usos_maximos) return 'agotado'
  return usos > 0 ? 'usado' : 'disponible'
}
