import { describe, expect, it } from 'vitest'
import { formatPesoLegible, pesoFacturableGramos, pesoVolumetricoGramos } from '@/lib/paquete'

describe('pesoVolumetricoGramos', () => {
  it('un cubo de 20 cm vale casi 3 kg para la tarifa', () => {
    // El dato mal cargado del caso real: 20×20×20 = 8000 cm³ ≈ 2,67 kg.
    expect(pesoVolumetricoGramos(20, 20, 20)).toBe(2667)
  })

  it('un sobre de marcapáginas no llega ni a 50 g de volumen', () => {
    expect(pesoVolumetricoGramos(16, 6, 1)).toBe(32)
  })
})

describe('pesoFacturableGramos', () => {
  it('gana el volumen cuando el paquete es liviano pero grande', () => {
    // El marcapáginas del pedido de prueba: pesaba 1 kg en la ficha, pero el
    // cubo de 20 cm lo tarifaba como 2,7 kg.
    expect(pesoFacturableGramos(1000, 20, 20, 20)).toBe(2667)
  })

  it('gana el peso cuando el paquete es denso', () => {
    expect(pesoFacturableGramos(5000, 16, 6, 1)).toBe(5000)
  })
})

describe('formatPesoLegible', () => {
  it('debajo del kilo queda en gramos', () => {
    expect(formatPesoLegible(300)).toBe('300 g')
  })

  it('desde el kilo pasa a kg con una decimal, en formato es-AR', () => {
    expect(formatPesoLegible(2667)).toBe('2,7 kg')
    expect(formatPesoLegible(1000)).toBe('1 kg')
  })
})
