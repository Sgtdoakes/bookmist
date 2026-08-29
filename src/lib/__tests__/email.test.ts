import { describe, it, expect } from 'vitest'
import { construirConfirmacionPedido, construirCambioEstado, linkSeguimiento } from '@/lib/email'
import type { CuentaPago } from '@/lib/configuracion'

// Estos mails los lee un cliente real y no se pueden corregir una vez
// enviados: lo que se testea acá es que lleven la información sin la que el
// mail no sirve (número de pedido, total, link con token) y que no se pueda
// inyectar HTML a través de un nombre de producto.

const CUENTAS: CuentaPago[] = [
  { id: '1', etiqueta: 'Banco Provincia', banco: 'Provincia', alias: 'bookmist', cbu: '0140', titular: 'Daniela' },
]

const BASE = {
  numeroPedido: 'BM-0042',
  token: 'abc123token',
  clienteNombre: 'Ana María Pérez',
  clienteEmail: 'ana@example.com',
  items: [
    { nombre: 'Caja Alas de Sangre', cantidad: 1, precio_unitario: 120000 },
    { nombre: 'Marcapáginas Sakura', cantidad: 2, precio_unitario: 6000 },
  ],
  costoEnvio: 8000,
  descuento: 6600,
  cuponCodigo: 'BIENVENIDOS',
  total: 133400,
  direccionEnvio: 'Av. Siempre Viva 742',
  zonaEnvio: 'Andreani a domicilio (CP 1655)',
  cuentas: CUENTAS,
}

describe('linkSeguimiento', () => {
  it('arma la URL con el token como query param', () => {
    expect(linkSeguimiento('BM-0042', 'abc123')).toContain('/pedido/BM-0042?t=abc123')
  })

  it('escapa un token con caracteres raros en vez de romper la URL', () => {
    expect(linkSeguimiento('BM-1', 'a b&c')).toContain('t=a%20b%26c')
  })
})

describe('construirConfirmacionPedido', () => {
  it('lleva número de pedido, items, total y el link con token', () => {
    const mail = construirConfirmacionPedido({ ...BASE, metodoPago: 'transferencia' })

    expect(mail.subject).toContain('BM-0042')
    expect(mail.html).toContain('Caja Alas de Sangre')
    expect(mail.html).toContain('Marcapáginas Sakura')
    expect(mail.html).toContain('/pedido/BM-0042?t=abc123token')
    // El total con formato argentino usa separador de miles.
    expect(mail.html).toMatch(/133\.400/)
    // La versión de texto plano también: hay clientes que solo leen esa.
    expect(mail.text).toContain('BM-0042')
    expect(mail.text).toContain('/pedido/BM-0042?t=abc123token')
  })

  it('saluda por el primer nombre, no por el nombre completo', () => {
    const mail = construirConfirmacionPedido({ ...BASE, metodoPago: 'transferencia' })
    expect(mail.html).toContain('¡Hola Ana!')
  })

  it('muestra el descuento con el código del cupón', () => {
    const mail = construirConfirmacionPedido({ ...BASE, metodoPago: 'transferencia' })
    expect(mail.html).toContain('BIENVENIDOS')
    expect(mail.html).toMatch(/−\s*\$/)
  })

  it('incluye los datos para transferir cuando el pago es por transferencia', () => {
    const mail = construirConfirmacionPedido({ ...BASE, metodoPago: 'transferencia' })
    expect(mail.html).toContain('Banco Provincia')
    expect(mail.html).toContain('bookmist')
  })

  it('NO incluye los datos bancarios cuando ya se pagó con Mercado Pago', () => {
    const mail = construirConfirmacionPedido({ ...BASE, metodoPago: 'mercadopago' })
    expect(mail.html).not.toContain('Banco Provincia')
    expect(mail.html).not.toContain('Para completar el pago')
  })

  it('dice "Gratis" y no "$ 0" cuando el envío no se cobra', () => {
    const mail = construirConfirmacionPedido({ ...BASE, metodoPago: 'transferencia', costoEnvio: 0 })
    expect(mail.html).toContain('Gratis')
  })

  it('escapa el HTML de un nombre de producto (no se puede inyectar markup)', () => {
    const mail = construirConfirmacionPedido({
      ...BASE,
      metodoPago: 'transferencia',
      items: [{ nombre: '<script>alert(1)</script>', cantidad: 1, precio_unitario: 100 }],
    })
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
  })
})

describe('construirCambioEstado', () => {
  const BASE_ESTADO = {
    numeroPedido: 'BM-0042',
    token: 'abc123token',
    clienteNombre: 'Ana María Pérez',
    clienteEmail: 'ana@example.com',
    total: 133400,
  }

  it('incluye el número de seguimiento y el link a Andreani cuando se envía', () => {
    const mail = construirCambioEstado({ ...BASE_ESTADO, estado: 'enviado', seguimiento: '360000123456' })
    expect(mail.html).toContain('360000123456')
    expect(mail.html).toContain('andreani.com')
    expect(mail.text).toContain('360000123456')
  })

  it('no inventa un bloque de seguimiento si todavía no hay número', () => {
    const mail = construirCambioEstado({ ...BASE_ESTADO, estado: 'enviado', seguimiento: null })
    expect(mail.html).not.toContain('Seguimiento Andreani')
    expect(mail.html).toContain('/pedido/BM-0042?t=abc123token')
  })

  it('no muestra seguimiento en un estado donde no aplica', () => {
    const mail = construirCambioEstado({ ...BASE_ESTADO, estado: 'pagado', seguimiento: '360000123456' })
    expect(mail.html).not.toContain('Seguimiento Andreani')
  })

  it('cada estado tiene su propio asunto', () => {
    const asuntos = (['pagado', 'enviado', 'entregado', 'cancelado'] as const).map(
      (estado) => construirCambioEstado({ ...BASE_ESTADO, estado, seguimiento: null }).subject,
    )
    expect(new Set(asuntos).size).toBe(4)
    asuntos.forEach((s) => expect(s).toContain('BM-0042'))
  })
})
