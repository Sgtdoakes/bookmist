import { describe, expect, it } from 'vitest'
import { checkoutSchema } from '@/lib/validations'

const ITEM = { producto_id: '123e4567-e89b-12d3-a456-426614174000', cantidad: 2 }

describe('checkoutSchema', () => {
  it('acepta un pedido válido', () => {
    const r = checkoutSchema.safeParse({
      cliente_nombre: 'Juana Pérez',
      cliente_email: 'juana@example.com',
      cliente_telefono: '1122334455',
      direccion_envio: 'Calle Falsa 123, Buenos Aires',
      metodo_pago: 'transferencia',
      items: [ITEM],
    })
    expect(r.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const r = checkoutSchema.safeParse({
      cliente_nombre: 'Juana',
      cliente_email: 'no-es-email',
      cliente_telefono: '1122334455',
      direccion_envio: 'Calle Falsa 123',
      metodo_pago: 'transferencia',
      items: [ITEM],
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('cliente_email'))).toBe(true)
    }
  })

  it('rechaza carrito vacío', () => {
    const r = checkoutSchema.safeParse({
      cliente_nombre: 'Juana',
      cliente_email: 'juana@example.com',
      cliente_telefono: '1122334455',
      direccion_envio: 'Calle Falsa 123',
      metodo_pago: 'transferencia',
      items: [],
    })
    expect(r.success).toBe(false)
  })

  it('rechaza dirección de envío demasiado corta', () => {
    const r = checkoutSchema.safeParse({
      cliente_nombre: 'Juana',
      cliente_email: 'juana@example.com',
      cliente_telefono: '1122334455',
      direccion_envio: 'X',
      metodo_pago: 'transferencia',
      items: [ITEM],
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('direccion_envio'))).toBe(true)
    }
  })

  it('rechaza un método de pago fuera del enum', () => {
    const r = checkoutSchema.safeParse({
      cliente_nombre: 'Juana',
      cliente_email: 'juana@example.com',
      cliente_telefono: '1122334455',
      direccion_envio: 'Calle Falsa 123',
      metodo_pago: 'mercadopago',
      items: [ITEM],
    })
    expect(r.success).toBe(false)
  })
})
