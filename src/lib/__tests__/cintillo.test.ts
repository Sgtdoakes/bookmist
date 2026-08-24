import { describe, expect, it } from 'vitest'
import { textoCintillo } from '@/lib/cintillo'

describe('textoCintillo', () => {
  it('sin texto propio anuncia el % por transferencia', () => {
    expect(textoCintillo({ visible: true, texto: '', descuentoPct: 5 })).toBe(
      '✨ 5% de descuento con transferencia ✨',
    )
  })

  it('el texto escrito por Dani reemplaza al automático', () => {
    expect(textoCintillo({ visible: true, texto: 'Envío gratis a partir de $60.000', descuentoPct: 5 })).toBe(
      'Envío gratis a partir de $60.000',
    )
  })

  it('apagado no dice nada, tenga el texto que tenga', () => {
    expect(textoCintillo({ visible: false, texto: 'Envío gratis', descuentoPct: 5 })).toBe('')
    expect(textoCintillo({ visible: false, texto: '', descuentoPct: 5 })).toBe('')
  })

  it('sin descuento y sin texto no hay nada que anunciar', () => {
    // El caso de deshabilitar el 5%: pct 0 no puede dejar una franja vacía.
    expect(textoCintillo({ visible: true, texto: '', descuentoPct: 0 })).toBe('')
  })

  it('con descuento apagado pero texto propio, el cartel sigue', () => {
    // Sacar el 5% no tiene por qué callar un anuncio que no habla de él.
    expect(textoCintillo({ visible: true, texto: 'Nueva colección Van Gogh', descuentoPct: 0 })).toBe(
      'Nueva colección Van Gogh',
    )
  })

  it('texto de solo espacios cuenta como vacío', () => {
    expect(textoCintillo({ visible: true, texto: '   ', descuentoPct: 0 })).toBe('')
  })
})
