import { describe, expect, it } from 'vitest'
import {
  codigoBienFormado,
  estadoCupon,
  generarCodigo,
  generarCodigosUnicos,
  normalizarCodigo,
} from '@/lib/cupon-codigo'

describe('normalizarCodigo', () => {
  it('saca espacios y pasa a mayúsculas', () => {
    expect(normalizarCodigo('  tesoro-k7m4q  ')).toBe('TESORO-K7M4Q')
  })
})

describe('codigoBienFormado', () => {
  it('acepta letras, números y guiones', () => {
    expect(codigoBienFormado('TESORO-K7M4Q')).toBe(true)
    expect(codigoBienFormado('primavera20')).toBe(true)
  })

  it('rechaza los comodines de LIKE, que es de lo que protege', () => {
    // Sin esto, tipear "%" en el campo de cupón haría match contra el primer
    // cupón activo de la tabla y se llevaría el descuento sin saber ningún código.
    expect(codigoBienFormado('%')).toBe(false)
    expect(codigoBienFormado('TES%')).toBe(false)
    expect(codigoBienFormado('_')).toBe(false)
  })

  it('rechaza espacios y vacío', () => {
    expect(codigoBienFormado('DOS PALABRAS')).toBe(false)
    expect(codigoBienFormado('')).toBe(false)
  })

  it('no deja que un código arranque con guion', () => {
    expect(codigoBienFormado('-TESORO')).toBe(false)
  })
})

describe('generarCodigo', () => {
  it('usa el prefijo separado por guion', () => {
    expect(generarCodigo('TESORO')).toMatch(/^TESORO-[A-Z0-9]{5}$/)
  })

  it('sin prefijo devuelve solo la parte aleatoria', () => {
    expect(generarCodigo('')).toMatch(/^[A-Z0-9]{5}$/)
  })

  it('limpia el prefijo de todo lo que no sea letra o número', () => {
    expect(generarCodigo(' te soro! ')).toMatch(/^TESORO-[A-Z0-9]{5}$/)
  })

  it('nunca mete caracteres que se confunden al leerlos de un papel', () => {
    // 0/O y 1/I/L: un cupón impreso se tipea a mano, y un 0 leído como O es
    // un cupón que "no anda".
    for (let i = 0; i < 300; i++) {
      expect(generarCodigo('')).not.toMatch(/[01IOL]/)
    }
  })

  it('el código que genera siempre pasa la validación de formato', () => {
    for (let i = 0; i < 100; i++) {
      expect(codigoBienFormado(generarCodigo('TESORO'))).toBe(true)
    }
  })
})

describe('generarCodigosUnicos', () => {
  it('devuelve la cantidad pedida, toda distinta', () => {
    const codigos = generarCodigosUnicos(50, 'TESORO', new Set())
    expect(codigos).toHaveLength(50)
    expect(new Set(codigos).size).toBe(50)
  })

  it('no repite ninguno de los que ya existen', () => {
    const existentes = new Set(generarCodigosUnicos(30, 'TESORO', new Set()))
    const nuevos = generarCodigosUnicos(30, 'TESORO', existentes)
    expect(nuevos).toHaveLength(30)
    for (const c of nuevos) expect(existentes.has(c)).toBe(true) // los fue acumulando
    expect(existentes.size).toBe(60) // 30 viejos + 30 nuevos, ninguno pisado
  })

  it('cantidad 0 devuelve lista vacía', () => {
    expect(generarCodigosUnicos(0, 'TESORO', new Set())).toEqual([])
  })
})

describe('estadoCupon', () => {
  it('un cupón nuevo sin usar está disponible', () => {
    expect(estadoCupon({ activo: true, usos_maximos: 1 }, 0)).toBe('disponible')
  })

  it('el de un solo uso muere con el primer uso', () => {
    // Es la regla de la búsqueda del tesoro: lo encuentra alguien, lo usa, y
    // ese código concreto deja de servir.
    expect(estadoCupon({ activo: true, usos_maximos: 1 }, 1)).toBe('agotado')
  })

  it('uno sin tope sigue sirviendo aunque ya lo hayan usado', () => {
    expect(estadoCupon({ activo: true, usos_maximos: null }, 20)).toBe('usado')
  })

  it('con tope de varios usos, sirve hasta llegar al tope', () => {
    expect(estadoCupon({ activo: true, usos_maximos: 3 }, 2)).toBe('usado')
    expect(estadoCupon({ activo: true, usos_maximos: 3 }, 3)).toBe('agotado')
  })

  it('apagado gana sobre cualquier otra cosa', () => {
    expect(estadoCupon({ activo: false, usos_maximos: null }, 0)).toBe('apagado')
    expect(estadoCupon({ activo: false, usos_maximos: 1 }, 1)).toBe('apagado')
  })

  it('más usos que el tope (dato viejo) sigue contando como agotado', () => {
    expect(estadoCupon({ activo: true, usos_maximos: 1 }, 5)).toBe('agotado')
  })
})
