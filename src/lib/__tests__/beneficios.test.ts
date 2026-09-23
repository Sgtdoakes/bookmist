import { describe, expect, it } from 'vitest'
import {
  cuotasSinInteres,
  metasDelCarrito,
  precioConTransferencia,
  progresoDelCarrito,
  type BeneficiosPrecio,
} from '@/lib/beneficios'

const BOOKMIST_HOY: BeneficiosPrecio = {
  descuentoTransferenciaPct: 5,
  cuotas: { cantidad: 3, minimo: 75000 },
  envioGratisUmbral: 60000,
}

describe('precioConTransferencia', () => {
  it('descuenta el % con el mismo redondeo que el checkout', () => {
    // /api/checkout: descuento = Math.round(subtotal * pct / 100)
    expect(precioConTransferencia(90200, 5)).toBe(90200 - Math.round(90200 * 0.05))
    expect(precioConTransferencia(24000, 5)).toBe(22800)
    expect(precioConTransferencia(6150, 5)).toBe(6150 - 308)
  })

  it('sin descuento o sin precio no hay nada que mostrar', () => {
    expect(precioConTransferencia(24000, 0)).toBeNull()
    expect(precioConTransferencia(0, 5)).toBeNull()
    expect(precioConTransferencia(24000, 150)).toBeNull()
  })
})

describe('cuotasSinInteres', () => {
  it('desde el mínimo, divide el precio en la cantidad de cuotas', () => {
    expect(cuotasSinInteres(90200, BOOKMIST_HOY.cuotas)).toEqual({ cantidad: 3, monto: 30067 })
    expect(cuotasSinInteres(75000, BOOKMIST_HOY.cuotas)).toEqual({ cantidad: 3, monto: 25000 })
  })

  it('por debajo del mínimo no muestra cuotas', () => {
    expect(cuotasSinInteres(74999, BOOKMIST_HOY.cuotas)).toBeNull()
    expect(cuotasSinInteres(24000, BOOKMIST_HOY.cuotas)).toBeNull()
  })

  it('0 o 1 cuota es "no mostrar cuotas"', () => {
    expect(cuotasSinInteres(90200, { cantidad: 0, minimo: 75000 })).toBeNull()
    expect(cuotasSinInteres(90200, { cantidad: 1, minimo: 0 })).toBeNull()
  })

  it('mínimo 0 muestra cuotas en cualquier precio', () => {
    expect(cuotasSinInteres(6000, { cantidad: 3, minimo: 0 })).toEqual({ cantidad: 3, monto: 2000 })
  })
})

describe('metasDelCarrito', () => {
  it('ordena las metas de la más cercana a la más lejana', () => {
    expect(metasDelCarrito(BOOKMIST_HOY)).toEqual([
      { tipo: 'envio', monto: 60000 },
      { tipo: 'cuotas', monto: 75000 },
    ])
    expect(metasDelCarrito({ ...BOOKMIST_HOY, envioGratisUmbral: 110000 }).map((m) => m.tipo)).toEqual([
      'cuotas',
      'envio',
    ])
  })

  it('una regla apagada no aparece en la barra', () => {
    expect(metasDelCarrito({ ...BOOKMIST_HOY, envioGratisUmbral: 0 })).toEqual([{ tipo: 'cuotas', monto: 75000 }])
    expect(metasDelCarrito({ ...BOOKMIST_HOY, cuotas: { cantidad: 0, minimo: 75000 } })).toEqual([
      { tipo: 'envio', monto: 60000 },
    ])
    // Cuotas desde cualquier monto: ya están siempre, no hay nada que perseguir.
    expect(metasDelCarrito({ ...BOOKMIST_HOY, cuotas: { cantidad: 3, minimo: 0 } })).toEqual([
      { tipo: 'envio', monto: 60000 },
    ])
  })
})

describe('progresoDelCarrito', () => {
  const metas = metasDelCarrito(BOOKMIST_HOY)

  it('con un kit de $24.000 falta para las dos metas', () => {
    const p = progresoDelCarrito(24000, metas)
    expect(p.siguiente).toMatchObject({ tipo: 'envio', falta: 36000 })
    expect(p.metas.map((m) => m.alcanzada)).toEqual([false, false])
    expect(p.porcentaje).toBeCloseTo(32)
    expect(p.metas.map((m) => m.posicion)).toEqual([80, 100])
  })

  it('en el umbral exacto el envío ya es gratis (igual que aplicarEnvioGratis)', () => {
    const p = progresoDelCarrito(60000, metas)
    expect(p.metas[0].alcanzada).toBe(true)
    expect(p.siguiente).toMatchObject({ tipo: 'cuotas', falta: 15000 })
  })

  it('pasada la última meta, la barra queda llena y no falta nada', () => {
    const p = progresoDelCarrito(90200, metas)
    expect(p.siguiente).toBeNull()
    expect(p.porcentaje).toBe(100)
    expect(p.metas.every((m) => m.alcanzada && m.falta === 0)).toBe(true)
  })

  it('sin metas no hay barra', () => {
    expect(progresoDelCarrito(50000, [])).toEqual({ metas: [], porcentaje: 0, siguiente: null })
  })
})
