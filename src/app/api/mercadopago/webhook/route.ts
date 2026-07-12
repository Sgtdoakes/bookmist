import { obtenerPago } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { verificarAutoMantenimiento } from '@/lib/mantenimiento'

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
