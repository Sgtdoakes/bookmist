import { describe, expect, it } from 'vitest'
import { resolverVistaPedido, esVisitaDeCompra } from '@/lib/pedido-confirmacion'

describe('resolverVistaPedido', () => {
  it('sin status (pago manual): confirmación genérica', () => {
    const v = resolverVistaPedido(null)
    expect(v.tipo).toBe('generico')
  })

  it('status approved: pago aprobado', () => {
    const v = resolverVistaPedido('approved')
    expect(v.tipo).toBe('aprobado')
  })

  it('status pending o in_process: pago pendiente', () => {
    expect(resolverVistaPedido('pending').tipo).toBe('pendiente')
    expect(resolverVistaPedido('in_process').tipo).toBe('pendiente')
  })

  it('status failure o rejected: pago rechazado', () => {
    expect(resolverVistaPedido('failure').tipo).toBe('rechazado')
    expect(resolverVistaPedido('rejected').tipo).toBe('rechazado')
  })

  it('status desconocido: cae a la confirmación genérica', () => {
    expect(resolverVistaPedido('algo-raro').tipo).toBe('generico')
  })
})

describe('esVisitaDeCompra', () => {
  it('transferencia: el navegador que compró trae el pedido, sin status', () => {
    expect(esVisitaDeCompra(null, true)).toBe(true)
  })

  it('vuelta de Mercado Pago sin sessionStorage: igual cuenta como venta', () => {
    // El caso que estaba roto: se pagaba desde el celular, la vuelta caía en
    // otra pestaña y la venta no se registraba en ningún lado.
    expect(esVisitaDeCompra('approved', false)).toBe(true)
    expect(esVisitaDeCompra('pending', false)).toBe(true)
  })

  it('pago rechazado: no hay venta que registrar', () => {
    expect(esVisitaDeCompra('failure', false)).toBe(false)
    expect(esVisitaDeCompra('rejected', false)).toBe(false)
    // Ni siquiera si el navegador tiene el pedido guardado.
    expect(esVisitaDeCompra('failure', true)).toBe(false)
  })

  it('link de seguimiento del mail: no vuelve a contar la compra', () => {
    expect(esVisitaDeCompra(null, false)).toBe(false)
    expect(esVisitaDeCompra('', false)).toBe(false)
  })
})
