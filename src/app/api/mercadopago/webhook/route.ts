import { obtenerPago } from '@/lib/mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'

// Webhook de Mercado Pago. MP avisa cuando cambia un pago.
// Nunca confiamos en el body del aviso: volvemos a pedirle a Mercado Pago el
// estado real del pago (con nuestro propio access token) antes de tocar la
// orden, así un tercero no puede forjar un "pago aprobado" falso.
// Respondemos 200 siempre y rápido para que MP no reintente en loop.
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
        await supabase
          .from('orders')
          .update({ estado: 'pagado', mp_payment_id: pago.id })
          .eq('id', pago.external_reference)
      }
    }
  } catch {
    // Nunca fallamos el webhook: devolvemos 200 igual.
  }

  return new Response(null, { status: 200 })
}

// MP a veces hace un GET de verificación.
export async function GET() {
  return new Response(null, { status: 200 })
}
