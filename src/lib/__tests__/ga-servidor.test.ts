import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enviarCompraGA4, gaServidorConfigurado, type CompraGA4 } from '@/lib/ga-servidor'

// Esta venta es la que Analytics no tenía forma de ver: la de quien paga con
// Mercado Pago y no vuelve nunca al sitio. Se testea el cuerpo del pedido
// porque el Measurement Protocol NO valida nada — contesta 204 igual con un
// evento mal armado y lo descarta en silencio, así que un error acá no daría
// ninguna señal hasta que Dani notara que faltan ventas.

const COMPRA: CompraGA4 = {
  orderId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  numeroPedido: 'BM-0042',
  createdAt: '2026-09-05T18:00:00.000Z',
  total: 45000,
  items: [
    { nombre: 'Caja Otoño', cantidad: 2, precio_unitario: 20000 },
    { nombre: 'Marcapáginas', cantidad: 1, precio_unitario: 5000 },
  ],
  clientId: '385739071.1788650190',
  sessionId: '1788661172',
}

function ultimaLlamada() {
  const mock = vi.mocked(globalThis.fetch)
  const [url, init] = mock.mock.calls[0] as [string, RequestInit]
  return { url, body: JSON.parse(init.body as string) }
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-4PEDMZN3Q8'
  process.env.GA4_API_SECRET = 'secreto'
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GA4_API_SECRET
})

describe('gaServidorConfigurado', () => {
  it('necesita las dos variables', () => {
    expect(gaServidorConfigurado()).toBe(true)
    delete process.env.GA4_API_SECRET
    expect(gaServidorConfigurado()).toBe(false)
  })
})

describe('enviarCompraGA4', () => {
  it('sin GA4_API_SECRET no llama a Google y lo dice', async () => {
    delete process.env.GA4_API_SECRET
    const r = await enviarCompraGA4(COMPRA)
    expect(r.sent).toBe(false)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('manda la venta con el formato que espera GA4', async () => {
    const r = await enviarCompraGA4(COMPRA)
    expect(r.sent).toBe(true)

    const { url, body } = ultimaLlamada()
    expect(url).toContain('measurement_id=G-4PEDMZN3Q8')
    expect(url).toContain('api_secret=secreto')

    expect(body.client_id).toBe('385739071.1788650190')
    expect(body.events).toHaveLength(1)
    expect(body.events[0].name).toBe('purchase')

    const params = body.events[0].params
    expect(params.transaction_id).toBe('BM-0042')
    expect(params.value).toBe(45000)
    expect(params.currency).toBe('ARS')
    expect(params.session_id).toBe('1788661172')
    // Sin esto GA4 acepta el evento pero no lo cuenta como actividad.
    expect(params.engagement_time_msec).toBe(1)
    expect(params.items).toEqual([
      { item_name: 'Caja Otoño', price: 20000, quantity: 2 },
      { item_name: 'Marcapáginas', price: 5000, quantity: 1 },
    ])
  })

  it('sin client_id real arma uno derivado del pedido, igual en cada reintento', async () => {
    const sinCookies = { ...COMPRA, clientId: null, sessionId: null }
    await enviarCompraGA4(sinCookies)
    const primero = ultimaLlamada().body.client_id
    expect(primero).toMatch(/^\d+\.\d+$/)

    vi.mocked(globalThis.fetch).mockClear()
    await enviarCompraGA4(sinCookies)
    // Derivado y no aleatorio: un reintento del webhook no puede inventar un
    // visitante nuevo cada vez.
    expect(ultimaLlamada().body.client_id).toBe(primero)
  })

  it('sin session_id no manda el campo (mejor ausente que vacío)', async () => {
    await enviarCompraGA4({ ...COMPRA, sessionId: null })
    expect(ultimaLlamada().body.events[0].params).not.toHaveProperty('session_id')
  })

  it('si Google contesta mal lo reporta en vez de romper', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })))
    const r = await enviarCompraGA4(COMPRA)
    expect(r.sent).toBe(false)
    expect(r.reason).toContain('500')
  })

  it('si se cae la red no propaga la excepción: el pago ya quedó registrado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ENOTFOUND')
      }),
    )
    await expect(enviarCompraGA4(COMPRA)).resolves.toEqual({ sent: false, reason: 'ENOTFOUND' })
  })
})
