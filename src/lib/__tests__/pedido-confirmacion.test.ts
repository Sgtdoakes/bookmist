import { describe, expect, it } from 'vitest'
import { resolverVistaPedido } from '@/lib/pedido-confirmacion'

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
