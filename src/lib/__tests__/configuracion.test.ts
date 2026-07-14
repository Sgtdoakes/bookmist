import { describe, expect, it } from 'vitest'
import { aplicarEnvioGratis } from '@/lib/configuracion'

describe('aplicarEnvioGratis', () => {
  it('deja el costo intacto por debajo del umbral', () => {
    expect(aplicarEnvioGratis(65999, 66000, 9800)).toBe(9800)
  })

  it('lo hace gratis justo en el umbral', () => {
    expect(aplicarEnvioGratis(66000, 66000, 9800)).toBe(0)
  })

  it('lo hace gratis por encima del umbral', () => {
    expect(aplicarEnvioGratis(120000, 66000, 9800)).toBe(0)
  })

  it('umbral 0 = regla apagada, nunca regala el envío', () => {
    expect(aplicarEnvioGratis(999999, 0, 9800)).toBe(9800)
  })

  it('umbral negativo también cuenta como apagado', () => {
    expect(aplicarEnvioGratis(999999, -1, 9800)).toBe(9800)
  })
})
