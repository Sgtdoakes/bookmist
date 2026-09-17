import { describe, expect, it } from 'vitest'
import {
  anioDe,
  codigoDeIdioma,
  esIsbnPlausible,
  limpiarIsbn,
  nombreDeIdioma,
} from '@/lib/isbn-formato'

describe('limpiarIsbn', () => {
  it('saca guiones y espacios, que es como viene impreso en la contratapa', () => {
    expect(limpiarIsbn('978-84-08-27033-1')).toBe('9788408270331')
    expect(limpiarIsbn(' 978 84 08 27033 1 ')).toBe('9788408270331')
  })

  it('conserva la X final del ISBN-10 y la deja en mayúscula', () => {
    expect(limpiarIsbn('84-414-147-x')).toBe('84414147X')
  })
})

describe('esIsbnPlausible', () => {
  it('acepta ISBN-13 e ISBN-10', () => {
    expect(esIsbnPlausible('9788408270331')).toBe(true)
    expect(esIsbnPlausible('978-84-08-27033-1')).toBe(true)
    expect(esIsbnPlausible('844141474X')).toBe(true)
  })

  it('rechaza lo que no tiene largo de ISBN', () => {
    expect(esIsbnPlausible('')).toBe(false)
    expect(esIsbnPlausible('1234')).toBe(false)
    expect(esIsbnPlausible('97884082703311')).toBe(false)
  })
})

describe('anioDe', () => {
  it('saca el año de cualquier formato de fecha que devuelvan las APIs', () => {
    expect(anioDe('2020')).toBe(2020)
    expect(anioDe('2020-05')).toBe(2020)
    expect(anioDe('2020-05-01')).toBe(2020)
    expect(anioDe('May 01, 2020')).toBe(2020)
  })

  it('devuelve null cuando no hay año o es absurdo', () => {
    expect(anioDe(null)).toBeNull()
    expect(anioDe('sin fecha')).toBeNull()
    expect(anioDe(2020)).toBeNull()
    // La base rechaza cualquier cosa fuera de 1000-2200 (migración 0036), así
    // que un año así tiene que quedar en null y no romper el guardado.
    expect(anioDe('0999')).toBeNull()
  })
})

describe('nombreDeIdioma', () => {
  it('traduce el código que devuelve Google Books a algo que se pueda leer', () => {
    expect(nombreDeIdioma('es')).toBe('Español')
    expect(nombreDeIdioma('en')).toBe('Inglés')
  })

  it('devuelve null si no hay código o Intl no lo reconoce', () => {
    expect(nombreDeIdioma('')).toBeNull()
    expect(nombreDeIdioma(null)).toBeNull()
    expect(nombreDeIdioma(42)).toBeNull()
    // Mejor vacío que mostrar "Zz" en la ficha de un libro.
    expect(nombreDeIdioma('zz')).toBeNull()
  })
})

describe('codigoDeIdioma', () => {
  it('devuelve el código BCP 47 que pide schema.org para inLanguage', () => {
    expect(codigoDeIdioma('Español')).toBe('es')
    expect(codigoDeIdioma('español')).toBe('es')
    expect(codigoDeIdioma(' Castellano ')).toBe('es')
    expect(codigoDeIdioma('Ingles')).toBe('en')
  })

  it('devuelve null para lo que no reconoce: mejor omitir el dato que emitir uno inválido', () => {
    expect(codigoDeIdioma(null)).toBeNull()
    expect(codigoDeIdioma('')).toBeNull()
    expect(codigoDeIdioma('Élfico')).toBeNull()
  })
})
