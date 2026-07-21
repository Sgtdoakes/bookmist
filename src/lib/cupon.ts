import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCuponBienvenida } from '@/lib/configuracion'
import type { Database } from '@/types/db'

export type CuponMotivoRechazo = 'invalido' | 'no_suscripto' | 'ya_usado'
export type CuponValidacion = { ok: true; pct: number } | { ok: false; motivo: CuponMotivoRechazo }

// Validación real del cupón de bienvenida — la usan tanto /api/checkout (la
// única fuente de verdad, la que de verdad aplica el descuento) como
// /api/cupon/validar (feedback en vivo antes de confirmar el pedido). Server
// side siempre, con el cliente de service role: ni suscriptores_newsletter
// ni orders tienen policy para `anon`.
//
// Dos capas además de "el código coincide" (decisión: un solo código para
// todos, "impenetrable" dentro de ese esquema):
// 1) el email de quien compra tiene que estar en suscriptores_newsletter —
//    alguien que nunca se suscribió no lo puede usar aunque sepa el código.
// 2) ese email no puede haber usado ya un cupón en un pedido anterior
//    (cualquier estado: pendiente/pagado/cancelado cuenta como "usado", para
//    no abrir la puerta a re-intentar infinitas veces con pedidos sin pagar).
// Límite conocido y aceptado: no hay verificación de que el mail sea
// realmente de esa persona, así que alguien decidido podría suscribirse con
// mails distintos para reusarlo — eso solo se cierra con verificación de
// email, descartada a propósito por simplicidad.
export async function validarCupon(
  supabase: SupabaseClient<Database>,
  codigoIngresado: string,
  emailComprador: string,
): Promise<CuponValidacion> {
  const cupon = await getCuponBienvenida()
  const codigo = codigoIngresado.trim().toUpperCase()
  if (!cupon.activo || cupon.codigo !== codigo) return { ok: false, motivo: 'invalido' }

  const email = emailComprador.trim()

  const { data: suscriptor } = await supabase
    .from('suscriptores_newsletter')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (!suscriptor) return { ok: false, motivo: 'no_suscripto' }

  const { data: usoPrevio } = await supabase
    .from('orders')
    .select('id')
    .ilike('cliente_email', email)
    .not('cupon_codigo', 'is', null)
    .limit(1)
    .maybeSingle()
  if (usoPrevio) return { ok: false, motivo: 'ya_usado' }

  return { ok: true, pct: cupon.pct }
}

export const CUPON_MOTIVO_MENSAJE: Record<CuponMotivoRechazo, string> = {
  invalido: 'Ese cupón no es válido.',
  no_suscripto: 'Ese cupón es solo para quienes se suscribieron con este mismo mail.',
  ya_usado: 'Ya usaste ese cupón en un pedido anterior.',
}
