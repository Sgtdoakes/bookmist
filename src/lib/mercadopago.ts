import 'server-only'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

export function mpConfigured() {
  return !!process.env.MP_ACCESS_TOKEN
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

function client() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN as string })
}

type ItemPref = { nombre: string; precio: number; cantidad: number }

// Crea una preferencia de Checkout Pro y devuelve el id + init_point (URL de
// pago). Checkout Pro ya cubre QR, billetera Mercado Pago y tarjetas en una
// sola integración — Bookmist no necesita una integración de QR de punto de
// venta separada porque no tiene local físico, todo se paga online.
export async function crearPreferencia(params: {
  orderId: string
  numeroPedido: string
  items: ItemPref[]
  costoEnvio: number | null
  emailCliente: string
}): Promise<{ id: string; init_point: string } | null> {
  if (!mpConfigured()) return null

  const base = siteUrl()
  const esHttps = base.startsWith('https://')

  const mpItems = params.items.map((it) => ({
    id: it.nombre.slice(0, 250),
    title: it.nombre,
    quantity: it.cantidad,
    unit_price: Number(it.precio),
    currency_id: 'ARS',
  }))
  if (params.costoEnvio && params.costoEnvio > 0) {
    mpItems.push({
      id: 'envio',
      title: 'Envío',
      quantity: 1,
      unit_price: Number(params.costoEnvio),
      currency_id: 'ARS',
    })
  }

  try {
    const pref = new Preference(client())
    const result = await pref.create({
      body: {
        items: mpItems,
        external_reference: params.orderId,
        payer: { email: params.emailCliente },
        back_urls: {
          success: `${base}/pedido/${params.numeroPedido}?status=approved`,
          failure: `${base}/pedido/${params.numeroPedido}?status=failure`,
          pending: `${base}/pedido/${params.numeroPedido}?status=pending`,
        },
        // auto_return solo funciona con URLs públicas https.
        ...(esHttps ? { auto_return: 'approved' as const } : {}),
        notification_url: `${base}/api/mercadopago/webhook`,
        statement_descriptor: 'BOOKMIST',
      },
    })
    if (!result.id || !result.init_point) return null
    return { id: result.id, init_point: result.init_point }
  } catch {
    return null
  }
}

// Consulta un pago por id (para el webhook). No confía en el body del
// webhook: siempre vuelve a preguntarle a Mercado Pago el estado real del
// pago con nuestro propio access token, así un tercero no puede forjar un
// aviso de "pago aprobado" para un pedido ajeno.
export async function obtenerPago(
  id: string,
): Promise<{ id: string; status: string; external_reference: string | null } | null> {
  if (!mpConfigured()) return null
  try {
    const payment = new Payment(client())
    const p = await payment.get({ id })
    return {
      id: String(p.id),
      status: p.status ?? 'unknown',
      external_reference: p.external_reference ?? null,
    }
  } catch {
    return null
  }
}
