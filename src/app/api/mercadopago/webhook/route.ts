import type { SupabaseClient } from '@supabase/supabase-js'
import { obtenerPago } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { verificarAutoMantenimiento } from '@/lib/mantenimiento'
import { notificarPagoAcreditado, enviarCambioEstado } from '@/lib/email'
import { enviarCompraGA4, gaServidorConfigurado } from '@/lib/ga-servidor'
import type { Database } from '@/types/db'

// Cuenta la venta en GA4, una sola vez por pedido.
//
// El "una sola vez" es el punto delicado: Mercado Pago reintenta el mismo
// aviso varias veces, y confirmar_pago_pedido (migración 0022) devuelve true
// también en los reintentos, así que no sirve para saber si esta es la
// primera confirmación. Por eso el pedido se "reclama" con un update que
// exige que `ga_purchase_enviado_at` siga en null: Postgres resuelve los
// updates fila por fila, así que si llegan dos avisos juntos uno solo se
// lleva la fila y el otro se va sin mandar nada.
//
// El reclamo va ANTES de mandar el evento. Al revés (mandar y después
// marcar), un corte entre las dos cosas dejaría el pedido sin marca y el
// reintento contaría la venta dos veces. Así, el peor caso es perder una
// venta en los números, que es preferible a inventar una que no existió.
async function registrarCompraEnGA4(
  supabase: SupabaseClient<Database>,
  orderId: string,
): Promise<void> {
  if (!gaServidorConfigurado()) return

  const { data: pedido, error } = await supabase
    .from('orders')
    .select('id,numero_pedido,total,created_at,ga_client_id,ga_session_id,order_items(nombre,cantidad,precio_unitario)')
    .eq('id', orderId)
    .maybeSingle()
  if (error || !pedido) return

  const { data: reclamado } = await supabase
    .from('orders')
    .update({ ga_purchase_enviado_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('ga_purchase_enviado_at', null)
    .select('id')
    .maybeSingle()
  if (!reclamado) return // otro aviso de MP ya la contó

  const { sent, reason } = await enviarCompraGA4({
    orderId: pedido.id,
    numeroPedido: pedido.numero_pedido,
    createdAt: pedido.created_at,
    total: pedido.total,
    items: pedido.order_items ?? [],
    clientId: pedido.ga_client_id,
    sessionId: pedido.ga_session_id,
  })
  if (!sent) {
    // Queda en los logs de Vercel: la venta está bien registrada en la base,
    // lo único que falta es que aparezca en Analytics.
    console.error(`[mp-webhook] compra NO registrada en GA4 (${pedido.numero_pedido}):`, reason)
  }
}

// Webhook de Mercado Pago. MP avisa cuando cambia un pago.
// Nunca confiamos en el body del aviso: volvemos a pedirle a Mercado Pago el
// estado real del pago (con nuestro propio access token) antes de tocar la
// orden, así un tercero no puede forjar un "pago aprobado" falso.
//
// Códigos de respuesta, pensados alrededor de los reintentos de MP:
//   - 200 cuando terminamos de procesar (o el aviso no nos aplica).
//   - 500 cuando un pago aprobado NO pudo persistirse completo (marcar
//     pagado + descontar stock): MP reintenta el aviso y, como el update es
//     idempotente, el reintento termina el trabajo. Antes respondíamos 200
//     fijo y un fallo transitorio se perdía para siempre — pasó de verdad:
//     el pedido BM-0003 quedó pagado sin descontar stock (sobreventa).
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    let tipo = url.searchParams.get('type') ?? url.searchParams.get('topic')
    let pagoId = url.searchParams.get('data.id') ?? url.searchParams.get('id')

    // Algunos eventos llegan en el body.
    try {
      const body = (await request.json()) as { type?: string; action?: string; data?: { id?: string } }
      tipo = tipo ?? body.type ?? null
      pagoId = pagoId ?? body.data?.id ?? null
    } catch {
      // sin body JSON: usamos los query params
    }

    if (tipo === 'payment' && pagoId) {
      const pago = await obtenerPago(String(pagoId))
      if (pago && pago.status === 'approved' && pago.external_reference) {
        const supabase = createAdminClient()
        // Marcar pagado + descontar stock en UNA transacción (migración
        // 0022): o se persisten juntos, o ninguno — y el reintento de MP
        // sobre un pedido ya pagado no vuelve a descontar (idempotente).
        const { data: procesado, error: rpcErr } = await supabase.rpc('confirmar_pago_pedido', {
          p_order_id: pago.external_reference,
          p_payment_id: String(pago.id),
        })
        if (rpcErr) {
          console.error('[mp-webhook] confirmar_pago_pedido falló', pago.external_reference, rpcErr.message)
          return new Response(null, { status: 500 })
        }
        if (!procesado) {
          // El pedido no existe (p. ej. se borró): no hay nada que
          // reintentar, pero lo dejamos registrado.
          console.warn('[mp-webhook] pago aprobado para un pedido inexistente', pago.external_reference)
        } else {
          // El stock acaba de cambiar: modo "reponiendo stock" automático.
          // Best-effort — el pago ya quedó persistido.
          try {
            await verificarAutoMantenimiento(supabase)
          } catch (e) {
            console.error('[mp-webhook] verificarAutoMantenimiento falló', e)
          }
          // El pedido acaba de pasar a 'pagado': se le avisa a Dani (entró la
          // plata) y al cliente (su pago se confirmó). Best-effort — si algo
          // falla el pago ya quedó registrado y MP no tiene por qué
          // reintentar, pero queda en los logs de Vercel.
          //
          // `estado_actualizado_at` se escribe acá y no dentro de la RPC
          // confirmar_pago_pedido (migración 0022) para no tocar una función
          // atómica que ya funciona: si este update fallara, lo peor que pasa
          // es una fecha vieja en la página de seguimiento — nunca un pago a
          // medio registrar.
          // La venta a GA4, mandada desde acá y no desde el navegador. Es lo
          // único que alcanza a quien paga y no vuelve al sitio: cierra la
          // app de Mercado Pago, o paga en efectivo por Rapipago dos días
          // después. Best-effort y aislado: el pago ya quedó registrado y un
          // problema con Analytics no puede hacer que MP reintente el aviso.
          try {
            await registrarCompraEnGA4(supabase, pago.external_reference)
          } catch (e) {
            console.error('[mp-webhook] registro de compra en GA4 falló', e)
          }

          try {
            const { data: pedido } = await supabase
              .from('orders')
              .select('numero_pedido,total,cliente_nombre,cliente_email,token_consulta,seguimiento')
              .eq('id', pago.external_reference)
              .maybeSingle()
            if (pedido) {
              await supabase
                .from('orders')
                .update({ estado_actualizado_at: new Date().toISOString() })
                .eq('id', pago.external_reference)

              const [aDani, aCliente] = await Promise.all([
                notificarPagoAcreditado({
                  numeroPedido: pedido.numero_pedido,
                  clienteNombre: pedido.cliente_nombre,
                  total: pedido.total,
                }),
                enviarCambioEstado({
                  numeroPedido: pedido.numero_pedido,
                  token: pedido.token_consulta,
                  clienteNombre: pedido.cliente_nombre,
                  clienteEmail: pedido.cliente_email,
                  estado: 'pagado',
                  seguimiento: pedido.seguimiento,
                  total: pedido.total,
                }),
              ])
              if (!aDani.sent) {
                console.error(`[mp-webhook] aviso a Daniela NO enviado (${pedido.numero_pedido}):`, aDani.reason)
              }
              if (!aCliente.sent) {
                console.error(`[mp-webhook] aviso al cliente NO enviado (${pedido.numero_pedido}):`, aCliente.reason)
              }
            }
          } catch (e) {
            console.error('[mp-webhook] aviso de pago falló', e)
          }
        }
      }
    }
  } catch (e) {
    console.error('[mp-webhook] error inesperado', e)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 200 })
}

// MP a veces hace un GET de verificación.
export async function GET() {
  return new Response(null, { status: 200 })
}
