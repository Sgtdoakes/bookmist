import { describe, expect, it } from 'vitest'
import { crc16CcittFalse, generarPayloadQrTransferencia } from '@/lib/qr-transferencia-ar'

describe('crc16CcittFalse', () => {
  it('coincide con el vector de test estándar de CRC-16/CCITT-FALSE', () => {
    // Vector de test canónico (independiente de EMV/BCRA): "123456789" -> 0x29B1.
    expect(crc16CcittFalse('123456789')).toBe('29B1')
  })
})

describe('generarPayloadQrTransferencia', () => {
  const base = { cuit: '20-00000000-1', aliasOCbu: 'mi.alias.test', nombre: 'Comercio Test', ciudad: 'CABA' }

  it('arma un payload bien formado (formato EMV QRCPS) y el CRC final es autoconsistente', () => {
    const payload = generarPayloadQrTransferencia(base)
    expect(payload.startsWith('000201')).toBe(true) // Payload Format Indicator
    expect(payload).toContain('501120000000001') // 50 + largo(11) + CUIT sin guiones
    expect(payload).toContain('5113mi.alias.test') // 51 + largo(13) + alias
    expect(payload.length).toBeGreaterThan(10)

    // El CRC declarado (últimos 4 chars) tiene que ser el mismo que recalcular
    // sobre el payload sin él (más el prefijo "6304" del propio campo).
    const sinCrc = payload.slice(0, -4)
    const crcDeclarado = payload.slice(-4)
    expect(sinCrc.endsWith('6304')).toBe(true)
    expect(crc16CcittFalse(sinCrc)).toBe(crcDeclarado)
  })

  it('usa Point of Initiation Method 11 (estático) sin monto', () => {
    const payload = generarPayloadQrTransferencia(base)
    expect(payload).toContain('010211')
  })

  it('usa Point of Initiation Method 12 (dinámico) y agrega el monto con monto', () => {
    const payload = generarPayloadQrTransferencia({ ...base, montoArs: 7500 })
    expect(payload).toContain('010212')
    expect(payload).toContain('54077500.00')
  })

  it('rechaza un CUIT con longitud inválida', () => {
    expect(() => generarPayloadQrTransferencia({ ...base, cuit: '123' })).toThrow()
  })

  it('trunca nombre y ciudad al máximo permitido por el estándar EMVCo', () => {
    const payload = generarPayloadQrTransferencia({
      ...base,
      nombre: 'N'.repeat(40),
      ciudad: 'C'.repeat(40),
    })
    expect(payload).toContain(`59${'25'}${'N'.repeat(25)}`)
    expect(payload).toContain(`60${'15'}${'C'.repeat(15)}`)
  })
})
