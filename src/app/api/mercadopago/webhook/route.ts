import { obtenerPago } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { verificarAutoMantenimiento } from '@/lib/mantenimiento'
import { notificarPagoAcreditado, enviarCambioEstado } from '@/lib/email'

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
