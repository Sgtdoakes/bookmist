import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { codigoBienFormado, normalizarCodigo } from '@/lib/cupon-codigo'
import type { Database } from '@/types/db'

export type CuponMotivoRechazo =
  | 'invalido'
  | 'agotado'
  | 'limite_persona'
  | 'no_suscripto'
  | 'ya_usado'
  | 'falta_email'

export type CuponValidacion =
  | { ok: true; pct: number; cuponId: string; codigo: string }
  | { ok: false; motivo: CuponMotivoRechazo }

// Cuántos pedidos consumió cada cupón, por ID. Desde la 0030 se cuenta por
// orders.cupon_id y no por el string: los códigos ahora se pueden editar
// desde el panel, y contar por nombre significaba que renombrar un cupón
// usado 18 veces le reseteaba la cuenta a cero y regalaba 30 descuentos más
// sin que nadie se enterara.
//
// Cuenta cualquier estado del pedido (pendiente/pagado/cancelado) a
// propósito — si solo contara los pagados, alguien podría armar pedidos sin
// pagar para reusar el mismo código todas las veces que quiera.
export async function contarUsosPorCupon(
  supabase: SupabaseClient<Database>,
  cuponIds?: string[],
): Promise<Record<string, number>> {
  let q = supabase.from('orders').select('cupon_id').not('cupon_id', 'is', null)
  if (cuponIds && cuponIds.length > 0) q = q.in('cupon_id', cuponIds)
  const { data, error } = await q
  if (error) throw error

  const usos: Record<string, number> = {}
  for (const fila of data ?? []) {
    if (!fila.cupon_id) continue
    usos[fila.cupon_id] = (usos[fila.cupon_id] ?? 0) + 1
  }
  return usos
}

// Cuántas veces usó ESTE cupón ESTA persona. Es lo único que se puede medir
// cuando 30 papeles llevan el mismo código impreso: el papel no prueba nada
// (quien tipea el código manda lo mismo tenga 1 papel o 10), así que el tope
// total acota el daño a lo que se imprimió y este número acota cuánto se
// puede llevar una sola persona.
async function contarUsosDePersona(
  supabase: SupabaseClient<Database>,
  cuponId: string,
  email: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('cupon_id', cuponId)
    .ilike('cliente_email', email)
  if (error) throw error
  return count ?? 0
}

// Validación real del cupón — la usan /api/checkout (la única fuente de
// verdad, la que de verdad aplica el descuento) y /api/cupon/validar
// (feedback en vivo antes de confirmar el pedido). Siempre server-side con
// el cliente de service role: ni `cupones` ni `orders` tienen policy para
// `anon`, justamente para que nadie se baje la lista de códigos.
//
// Cada cupón trae sus propias reglas y solo se chequea lo que ese cupón
// pide. Un cupón de la calle con requiere_suscripcion = false ni mira el
// mail; el de bienvenida sí, porque es su razón de ser.
//
// `emailComprador` puede venir vacío: en /api/cupon/validar el cliente puede
// apretar "Aplicar" antes de completar su mail. Solo se exige si el cupón lo
// necesita — de ahí el motivo 'falta_email', que pide el dato en vez de
// decirle que el cupón no sirve.
//
// Límite conocido y aceptado: entre que se cuentan los usos y que
// /api/checkout inserta el pedido no hay un lock, así que dos personas
// tipeando el mismo código en el mismo instante podrían pasar las dos.
// Cerrarlo del todo obligaría a mover la creación del pedido entera a una
// función de Postgres; con el volumen de esta tienda el riesgo es un
// descuento de más, no una sobreventa.
export async function validarCupon(
  supabase: SupabaseClient<Database>,
  codigoIngresado: string,
  emailComprador: string,
): Promise<CuponValidacion> {
  const codigo = normalizarCodigo(codigoIngresado)
  if (!codigo || !codigoBienFormado(codigo)) return { ok: false, motivo: 'invalido' }

  const { data: cupon } = await supabase.from('cupones').select('*').ilike('codigo', codigo).maybeSingle()
  if (!cupon || !cupon.activo) return { ok: false, motivo: 'invalido' }

  // Cupo total: acá es donde se apaga solo el cupón impreso al llegar a la
  // cantidad de papeles que se repartieron.
  if (cupon.usos_maximos != null) {
    const usos = await contarUsosPorCupon(supabase, [cupon.id])
    if ((usos[cupon.id] ?? 0) >= cupon.usos_maximos) return { ok: false, motivo: 'agotado' }
  }

  const email = emailComprador.trim()
  const necesitaEmail = cupon.requiere_suscripcion || cupon.usos_maximos_por_email != null
  if (necesitaEmail && !email) return { ok: false, motivo: 'falta_email' }

  if (cupon.requiere_suscripcion) {
    const { data: suscriptor } = await supabase
      .from('suscriptores_newsletter')
      .select('id')
      .ilike('email', email)
      .maybeSingle()
    if (!suscriptor) return { ok: false, motivo: 'no_suscripto' }
  }

  if (cupon.usos_maximos_por_email != null) {
    const usados = await contarUsosDePersona(supabase, cupon.id, email)
    if (usados >= cupon.usos_maximos_por_email) {
      // Con tope 1 el mensaje honesto es "ya lo usaste"; con tope mayor, que
      // llegó a su límite. Son situaciones distintas para quien compra.
      return { ok: false, motivo: cupon.usos_maximos_por_email === 1 ? 'ya_usado' : 'limite_persona' }
    }
  }

  return { ok: true, pct: cupon.pct, cuponId: cupon.id, codigo: cupon.codigo }
}

export const CUPON_MOTIVO_MENSAJE: Record<CuponMotivoRechazo, string> = {
  invalido: 'Ese cupón no es válido.',
  agotado: 'Ese cupón ya se agotó.',
  limite_persona: 'Ya usaste ese cupón todas las veces permitidas.',
  no_suscripto: 'Ese cupón es solo para quienes se suscribieron con este mismo mail.',
  ya_usado: 'Ya usaste ese cupón en un pedido anterior.',
  falta_email: 'Completá tu email primero para poder validar el cupón.',
}
