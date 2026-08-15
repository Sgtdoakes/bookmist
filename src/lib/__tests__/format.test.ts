import { describe, expect, it } from 'vitest'
import { enUnaLinea, formatARS, separarEnParrafos } from '@/lib/format'

describe('formatARS', () => {
  it('formatea con separador de miles y sin decimales', () => {
    const out = formatARS(18900)
    expect(out).toContain('18.900')
    expect(out).toContain('$')
    expect(out).not.toContain(',') // sin centavos
  })

  it('acepta strings numéricos', () => {
    expect(formatARS('24900')).toContain('24.900')
  })

  it('devuelve $0 para null/undefined', () => {
    expect(formatARS(null)).toContain('0')
    expect(formatARS(undefined)).toContain('0')
  })

  it('devuelve $0 para valores no numéricos', () => {
    expect(formatARS('no-es-un-numero')).toContain('0')
  })
})

describe('separarEnParrafos', () => {
  it('parte en párrafos por líneas en blanco', () => {
    expect(separarEnParrafos('Primero.\n\nSegundo.\n\nTercero.')).toEqual([
      'Primero.',
      'Segundo.',
      'Tercero.',
    ])
  })

  it('un salto simple no abre párrafo nuevo', () => {
    expect(separarEnParrafos('Una línea\notra línea')).toEqual(['Una línea\notra línea'])
  })

  it('tolera saltos de Windows y líneas en blanco de más', () => {
    expect(separarEnParrafos('Uno.\r\n\r\n\r\nDos.')).toEqual(['Uno.', 'Dos.'])
    expect(separarEnParrafos('Uno.\n   \nDos.')).toEqual(['Uno.', 'Dos.'])
  })

  it('devuelve lista vacía para texto vacío, en blanco o ausente', () => {
    expect(separarEnParrafos(null)).toEqual([])
    expect(separarEnParrafos(undefined)).toEqual([])
    expect(separarEnParrafos('')).toEqual([])
    expect(separarEnParrafos('\n\n  \n')).toEqual([])
  })
})

describe('enUnaLinea', () => {
  it('aplasta saltos y espacios repetidos en un solo espacio', () => {
    expect(enUnaLinea('Primero.\n\nSegundo.')).toBe('Primero. Segundo.')
    expect(enUnaLinea('  hola   mundo  ')).toBe('hola mundo')
  })

  it('devuelve string vacío para null/undefined', () => {
    expect(enUnaLinea(null)).toBe('')
    expect(enUnaLinea(undefined)).toBe('')
  })
})
