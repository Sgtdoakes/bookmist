import { describe, expect, it } from 'vitest'
import { whatsappLink } from '@/lib/whatsapp'

describe('whatsappLink', () => {
  it('arma un link wa.me con el teléfono y el mensaje encodeado', () => {
    const link = whatsappLink('5491122334455', 'Hola Bookmist!')
    expect(link).toBe('https://wa.me/5491122334455?text=Hola%20Bookmist!')
  })

  it('saca cualquier caracter no numérico del teléfono', () => {
    const link = whatsappLink('+54 9 11 2233-4455', 'Hola')
    expect(link).toBe('https://wa.me/5491122334455?text=Hola')
  })
})
