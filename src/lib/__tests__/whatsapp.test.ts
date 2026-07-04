import { describe, expect, it } from 'vitest'
import { whatsappLink, construirMensajePedido, type DatosPedidoMensaje } from '@/lib/whatsapp'

describe('whatsappLink', () => {
  it('arma un link wa.me con el teléfono y el mensaje encodeado', () => {
    const link = whatsappLink('5491122334455', 'Hola Bookmist!')
    expect(link).toBe('https://wa.me/5491122334455?text=Hola%20Bookmist!')
  })

  it('saca cualquier caracter no numérico del teléfono', () => {
    const link = whatsappLink('+54 9 11 2233-4455', 'Hola')
    expect(link).toBe('https://wa.me/5491122334455?text=Hola')
  })
})

describe('construirMensajePedido', () => {
  const base: DatosPedidoMensaje = {
    numeroPedido: 'BM-0001',
    clienteNombre: 'Juana Pérez',
    clienteTelefono: '1122334455',
    items: [{ nombre: 'Kit Terror en la Bruma', cantidad: 2, precio_unitario: 24900 }],
    direccionEnvio: 'Calle Falsa 123, Buenos Aires',
    costoEnvio: 3500,
    metodoPago: 'transferencia',
    total: 53300,
    notas: null,
  }

  it('incluye el número de pedido, cliente e items', () => {
    const msg = construirMensajePedido(base)
    expect(msg).toContain('BM-0001')
    expect(msg).toContain('Juana Pérez')
    expect(msg).toContain('2x Kit Terror en la Bruma')
  })

  it('muestra el costo de envío cuando está definido', () => {
    const msg = construirMensajePedido(base)
    expect(msg).toContain('49.800') // 24900 * 2, sin el envío
    expect(msg).not.toContain('a coordinar')
  })

  it('muestra "a coordinar" cuando el costo de envío es null', () => {
    const msg = construirMensajePedido({ ...base, costoEnvio: null })
    expect(msg).toContain('a coordinar')
  })

  it('incluye las notas solo si están presentes', () => {
    const sinNotas = construirMensajePedido(base)
    expect(sinNotas).not.toContain('Notas:')

    const conNotas = construirMensajePedido({ ...base, notas: 'Dejar en portería' })
    expect(conNotas).toContain('Notas: Dejar en portería')
  })

  it('incluye la zona de envío solo si está presente', () => {
    const sinZona = construirMensajePedido(base)
    expect(sinZona).not.toContain('Zona:')

    const conZona = construirMensajePedido({ ...base, zonaEnvio: 'CABA y GBA' })
    expect(conZona).toContain('Zona: CABA y GBA')
  })
})
