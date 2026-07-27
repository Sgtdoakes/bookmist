import { describe, expect, it } from 'vitest'
import { fechaEstimadaEntrega } from '@/lib/fecha-estimada-entrega'

describe('fechaEstimadaEntrega', () => {
  it('retiro: suma 2 días corridos', () => {
    // Lunes 2026-08-03 + 2 días corridos = miércoles 2026-08-05
    const r = fechaEstimadaEntrega('retiro', new Date(2026, 7, 3))
    expect(r).toBe('2026-08-05')
  })

  it('domicilio: suma 5 días hábiles salteando el fin de semana', () => {
    // Lunes 2026-08-03 + 5 días hábiles = lunes 2026-08-10 (saltea sáb/dom)
    const r = fechaEstimadaEntrega('domicilio', new Date(2026, 7, 3))
    expect(r).toBe('2026-08-10')
  })

  it('domicilio: si el punto de partida es viernes, también saltea el fin de semana', () => {
    // Viernes 2026-08-07 + 5 días hábiles = viernes 2026-08-14
    const r = fechaEstimadaEntrega('domicilio', new Date(2026, 7, 7))
    expect(r).toBe('2026-08-14')
  })

  it('sin modo_envio (ausente) se trata como domicilio', () => {
    const r = fechaEstimadaEntrega(undefined, new Date(2026, 7, 3))
    expect(r).toBe('2026-08-10')
  })
})
