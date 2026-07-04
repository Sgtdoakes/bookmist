import { describe, expect, it } from 'vitest'
import { checkoutSchema } from '@/lib/validations'

const ITEM = { producto_id: '123e4567-e89b-12d3-a456-426614174000', cantidad: 2 }
const ZONA_ID = '223e4567-e89b-12d3-a456-426614174000'

const PEDIDO_VALIDO = {
  cliente_nombre: 'Juana Pérez',
  cliente_email: 'juana@example.com',
  cliente_telefono: '1122334455',
  direccion_envio: 'Calle Falsa 123, Buenos Aires',
  zona_id: ZONA_ID,
  metodo_pago: 'transferencia' as const,
  items: [ITEM],
}

describe('checkoutSchema', () => {
  it('acepta un pedido válido', () => {
    const r = checkoutSchema.safeParse(PEDIDO_VALIDO)
    expect(r.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const r = checkoutSchema.safeParse({ ...PEDIDO_VALIDO, cliente_email: 'no-es-email' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('cliente_email'))).toBe(true)
    }
  })

  it('rechaza carrito vacío', () => {
    const r = checkoutSchema.safeParse({ ...PEDIDO_VALIDO, items: [] })
    expect(r.success).toBe(false)
  })

  it('rechaza dirección de envío demasiado corta', () => {
    const r = checkoutSchema.safeParse({ ...PEDIDO_VALIDO, direccion_envio: 'X' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('direccion_envio'))).toBe(true)
    }
  })

  it('rechaza sin zona de envío elegida', () => {
    const r = checkoutSchema.safeParse({ ...PEDIDO_VALIDO, zona_id: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('zona_id'))).toBe(true)
    }
  })

  it('rechaza un método de pago fuera del enum', () => {
    const r = checkoutSchema.safeParse({ ...PEDIDO_VALIDO, metodo_pago: 'bitcoin' })
    expect(r.success).toBe(false)
  })

  it('acepta mercadopago como método de pago', () => {
    const r = checkoutSchema.safeParse({ ...PEDIDO_VALIDO, metodo_pago: 'mercadopago' })
    expect(r.success).toBe(true)
  })
})
