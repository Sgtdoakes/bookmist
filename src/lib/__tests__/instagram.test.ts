import { describe, expect, it } from 'vitest'
import { decidirRenovacionToken } from '@/lib/instagram'

describe('decidirRenovacionToken', () => {
  it('espera si el token tiene menos de 24hs', () => {
    expect(decidirRenovacionToken(2)).toEqual({
      accion: 'esperar',
      motivo: 'el token tiene menos de 24hs, todavía no se puede renovar',
    })
  })

  it('espera entre el día 1 y el día 45', () => {
    const d = decidirRenovacionToken(30 * 24)
    expect(d.accion).toBe('esperar')
  })

  it('renueva a partir del día 45', () => {
    const d = decidirRenovacionToken(45 * 24)
    expect(d.accion).toBe('renovar')
  })

  it('renueva si ya está vencido (edad mayor a 60 días)', () => {
    const d = decidirRenovacionToken(70 * 24)
    expect(d.accion).toBe('renovar')
  })
})
