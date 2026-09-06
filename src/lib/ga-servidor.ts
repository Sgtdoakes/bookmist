import 'server-only'

// Manda el evento de compra a GA4 desde el servidor (Measurement Protocol).
//
// Existe por un caso que el navegador no puede cubrir: quien paga con Mercado
// Pago y no vuelve al sitio. Cierra la app después de pagar, o paga en
// efectivo dos días más tarde por Rapipago — la venta es real, está en la
// base y en el mail de Dani, pero como el evento `purchase` lo mandaba la
// página de confirmación, si nadie abría esa página la venta no existía para
// Analytics. Acá el disparador es el webhook de Mercado Pago confirmando el
// pago, así que no depende de que el cliente haga nada.
//
// Apagado sin credenciales, mismo patrón que Andreani/Mercado Pago/Instagram:
// sin GA4_API_SECRET no se manda nada y el pago se procesa igual. Nunca
// devuelve una excepción hacia arriba — que Analytics falle no puede hacer
// que Mercado Pago reintente un pago que ya quedó bien registrado.

const ENDPOINT = 'https://www.google-analytics.com/mp/collect'

export function gaServidorConfigurado() {
  return !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && !!process.env.GA4_API_SECRET
}

// GA4 exige un client_id sí o sí. Cuando el checkout no pudo capturar el real
// (el visitante bloquea Analytics, o entró con la cookie recién creada) se
// arma uno derivado del id del pedido: la venta se cuenta igual, aunque
// aparezca como visitante nuevo sin origen. Derivado y no aleatorio para que
// un reintento del webhook no invente un visitante distinto cada vez.
function clientIdDeReserva(orderId: string, createdAt: string): string {
  const hex = orderId.replace(/-/g, '').slice(0, 8)
  const numero = Number.parseInt(hex, 16) || 1
  const segundos = Math.floor(new Date(createdAt).getTime() / 1000) || 1
  return `${numero}.${segundos}`
}

export type CompraGA4 = {
  orderId: string
  numeroPedido: string
  createdAt: string
  total: number
  items: { nombre: string; cantidad: number; precio_unitario: number }[]
  clientId: string | null
  sessionId: string | null
}

export async function enviarCompraGA4(
  compra: CompraGA4,
): Promise<{ sent: boolean; reason?: string }> {
  if (!gaServidorConfigurado()) return { sent: false, reason: 'GA4 sin configurar (falta GA4_API_SECRET)' }

  const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string,
  )}&api_secret=${encodeURIComponent(process.env.GA4_API_SECRET as string)}`

  const params: Record<string, unknown> = {
    transaction_id: compra.numeroPedido,
    value: compra.total,
    currency: 'ARS',
    items: compra.items.map((i) => ({
      item_name: i.nombre,
      price: i.precio_unitario,
      quantity: i.cantidad,
    })),
    // Sin engagement_time_msec, GA4 acepta el evento pero no lo cuenta como
    // actividad y la venta puede no aparecer en los informes estándar.
    engagement_time_msec: 1,
  }
  // Sin session_id GA4 abre una sesión nueva para este evento y la venta
  // pierde de dónde venía el visitante. Solo lo tenemos si el checkout pudo
  // leer la cookie (src/lib/ga-cliente.ts).
  if (compra.sessionId) params.session_id = compra.sessionId

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: compra.clientId ?? clientIdDeReserva(compra.orderId, compra.createdAt),
        events: [{ name: 'purchase', params }],
      }),
    })
    // El Measurement Protocol contesta 204 sin cuerpo y NO valida el
    // contenido: un evento mal armado se acepta con 204 y se descarta en
    // silencio. Si algo no cuadra, se prueba a mano contra
    // /debug/mp/collect, que sí devuelve los errores de validación.
    if (!res.ok) return { sent: false, reason: `GA4 respondió ${res.status}` }
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'error de red' }
  }
}
