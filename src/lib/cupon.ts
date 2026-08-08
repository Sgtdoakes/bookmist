import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { codigoBienFormado, normalizarCodigo } from '@/lib/cupon-codigo'
import type { Database } from '@/types/db'

export type CuponMotivoRechazo = 'invalido' | 'agotado' | 'no_suscripto' | 'ya_usado' | 'falta_email'
export type CuponValidacion = { ok: true; pct: number } | { ok: false; motivo: CuponMotivoRechazo }

// Cuántos pedidos usaron cada código. La fuente es orders.cupon_codigo, no un
// contador propio en la tabla `cupones`: es el único registro de que el
// descuento se aplicó de verdad, y así no hay dos números que puedan
// discrepar. Cuenta cualquier estado (pendiente/pagado/cancelado) a
// propósito — si solo contara los pagados, alguien podría armar pedidos sin
// pagar para reusar el mismo código todas las veces que quiera.
export async function contarUsosPorCodigo(
  supabase: SupabaseClient<Database>,
  codigos?: string[],
): Promise<Record<string, number>> {
  let q = supabase.from('orders').select('cupon_codigo').not('cupon_codigo', 'is', null)
  if (codigos && codigos.length > 0) q = q.in('cupon_codigo', codigos)
  const { data, error } = await q
  if (error) throw error

  const usos: Record<string, number> = {}
  for (const fila of data ?? []) {
    if (!fila.cupon_codigo) continue
    const codigo = normalizarCodigo(fila.cupon_codigo)
    usos[codigo] = (usos[codigo] ?? 0) + 1
  }
  return usos
}

// Validación real del cupón — la usan /api/checkout (la única fuente de
// verdad, la que de verdad aplica el descuento) y /api/cupon/validar
// (feedback en vivo antes de confirmar el pedido). Siempre server-side con
// el cliente de service role: ni `cupones` ni `orders` tienen policy para
// `anon`, justamente para que nadie se baje la lista de códigos.
//
// Las reglas ya no están hardcodeadas como antes (cuando había un solo cupón
// atado al newsletter): cada cupón trae las suyas, y solo se chequea lo que
// ese cupón pide. Un cupón de la calle con requiere_suscripcion = false ni
// mira el mail; el de bienvenida sí, porque es su razón de ser.
//
// `emailComprador` puede venir vacío: en /api/cupon/validar el cliente puede
// apretar "Aplicar" antes de completar su mail. Solo se exige si el cupón lo
// necesita — de ahí el motivo 'falta_email', que pide el dato en vez de
// decirle que el cupón no sirve.
//
// Límite conocido y aceptado: entre que se cuentan los usos y que
// /api/checkout inserta el pedido no hay un lock, así que dos personas
// tipeando el MISMO código en el mismo instante podrían pasar las dos. Con
// cupones de un solo uso impresos en papeles distintos eso no puede pasar
// (cada uno tiene su código), y cerrarlo del todo obligaría a mover la
// creación del pedido entero a una función de Postgres.
export async function validarCupon(
  supabase: SupabaseClient<Database>,
  codigoIngresado: string,
  emailComprador: string,
): Promise<CuponValidacion> {
  const codigo = normalizarCodigo(codigoIngresado)
  if (!codigo || !codigoBienFormado(codigo)) return { ok: false, motivo: 'invalido' }

  const { data: cupon } = await supabase.from('cupones').select('*').ilike('codigo', codigo).maybeSingle()
  if (!cupon || !cupon.activo) return { ok: false, motivo: 'invalido' }

  // Tope de usos: acá es donde muere el cupón del tesoro apenas alguien lo
  // usa (usos_maximos = 1).
  if (cupon.usos_maximos != null) {
    const usos = await contarUsosPorCodigo(supabase, [cupon.codigo])
    if ((usos[normalizarCodigo(cupon.codigo)] ?? 0) >= cupon.usos_maximos) {
      return { ok: false, motivo: 'agotado' }
    }
  }

  const email = emailComprador.trim()
  const necesitaEmail = cupon.requiere_suscripcion || cupon.una_vez_por_email
  if (necesitaEmail && !email) return { ok: false, motivo: 'falta_email' }

  if (cupon.requiere_suscripcion) {
    const { data: suscriptor } = await supabase
      .from('suscriptores_newsletter')
      .select('id')
      .ilike('email', email)
      .maybeSingle()
    if (!suscriptor) return { ok: false, motivo: 'no_suscripto' }
  }

  // "Ya usaste ESTE cupón", no "ya usaste algún cupón" (que era la regla
  // vieja, cuando el de bienvenida era el único que existía). Con varios
  // cupones dando vueltas, la regla vieja significaría que encontrar un
  // papelito en la calle te deja sin el de bienvenida para siempre.
  if (cupon.una_vez_por_email) {
    const { data: usoPrevio } = await supabase
      .from('orders')
      .select('id')
      .ilike('cliente_email', email)
      .ilike('cupon_codigo', cupon.codigo)
      .limit(1)
      .maybeSingle()
    if (usoPrevio) return { ok: false, motivo: 'ya_usado' }
  }

  return { ok: true, pct: cupon.pct }
}

export const CUPON_MOTIVO_MENSAJE: Record<CuponMotivoRechazo, string> = {
  invalido: 'Ese cupón no es válido.',
  agotado: 'Ese cupón ya fue usado.',
  no_suscripto: 'Ese cupón es solo para quienes se suscribieron con este mismo mail.',
  ya_usado: 'Ya usaste ese cupón en un pedido anterior.',
  falta_email: 'Completá tu email primero para poder validar el cupón.',
}
