import { describe, expect, it } from 'vitest'
import { hrefSeguro, minutosDeLectura, parsearCuerpo, parsearInline, textoPlanoDelCuerpo } from '@/lib/blog-cuerpo'

describe('parsearInline', () => {
  it('reconoce negrita y links a productos', () => {
    expect(parsearInline('Leé **Alas de sangre** y sumale [el kit](/productos/kit-zodiac).')).toEqual([
      { tipo: 'texto', texto: 'Leé ' },
      { tipo: 'negrita', texto: 'Alas de sangre' },
      { tipo: 'texto', texto: ' y sumale ' },
      { tipo: 'link', texto: 'el kit', href: '/productos/kit-zodiac', externo: false },
      { tipo: 'texto', texto: '.' },
    ])
  })

  it('los links de afuera se marcan como externos', () => {
    expect(parsearInline('[IG](https://instagram.com/bookmist.literaria)')).toEqual([
      { tipo: 'link', texto: 'IG', href: 'https://instagram.com/bookmist.literaria', externo: true },
    ])
  })

  it('un destino peligroso queda como texto común, pegado al de al lado', () => {
    expect(parsearInline('mirá [acá](javascript:alert(1)) ya')).toEqual([
      { tipo: 'texto', texto: 'mirá acá) ya' },
    ])
    expect(parsearInline('[otro](//malo.com)')).toEqual([{ tipo: 'texto', texto: 'otro' }])
  })

  it('texto sin marcas vuelve entero', () => {
    expect(parsearInline('Solo texto, con * sueltos y [corchetes]')).toEqual([
      { tipo: 'texto', texto: 'Solo texto, con * sueltos y [corchetes]' },
    ])
  })
})

describe('hrefSeguro', () => {
  it('acepta rutas del sitio y http(s)', () => {
    expect(hrefSeguro('/productos/x')).toEqual({ href: '/productos/x', externo: false })
    expect(hrefSeguro('https://bookmist.com.ar')).toEqual({ href: 'https://bookmist.com.ar', externo: true })
  })

  it('rechaza cualquier otro esquema', () => {
    expect(hrefSeguro('javascript:alert(1)')).toBeNull()
    expect(hrefSeguro('data:text/html,hola')).toBeNull()
    expect(hrefSeguro('//evil.com')).toBeNull()
    expect(hrefSeguro('productos/x')).toBeNull()
  })
})

describe('parsearCuerpo', () => {
  it('separa subtítulos, párrafos y listas por línea en blanco', () => {
    const cuerpo = [
      'Primer párrafo.\nCon un salto adentro.',
      '## Qué incluye la caja',
      '- Un libro\n- Un **marcapáginas**',
    ].join('\n\n')
    expect(parsearCuerpo(cuerpo)).toEqual([
      { tipo: 'parrafo', contenido: [{ tipo: 'texto', texto: 'Primer párrafo.\nCon un salto adentro.' }] },
      { tipo: 'subtitulo', contenido: [{ tipo: 'texto', texto: 'Qué incluye la caja' }] },
      {
        tipo: 'lista',
        items: [
          [{ tipo: 'texto', texto: 'Un libro' }],
          [
            { tipo: 'texto', texto: 'Un ' },
            { tipo: 'negrita', texto: 'marcapáginas' },
          ],
        ],
      },
    ])
  })

  it('un bloque con un guion suelto no es lista', () => {
    expect(parsearCuerpo('- esto sí\nesto no')[0].tipo).toBe('parrafo')
  })

  it('vacío no dibuja nada', () => {
    expect(parsearCuerpo('')).toEqual([])
    expect(parsearCuerpo(null)).toEqual([])
  })
})

describe('texto plano y lectura', () => {
  it('saca las marcas y deja solo lo que se lee', () => {
    expect(textoPlanoDelCuerpo('## Hola\n\nLeé **esto** y [aquello](/productos/a).')).toBe(
      'Hola Leé esto y aquello.',
    )
  })

  it('cuenta ~200 palabras por minuto, nunca menos de 1', () => {
    expect(minutosDeLectura('corta')).toBe(1)
    expect(minutosDeLectura(Array(1000).fill('palabra').join(' '))).toBe(5)
  })
})
