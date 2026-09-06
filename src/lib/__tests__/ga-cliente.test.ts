import { describe, expect, it } from 'vitest'
import { clientIdDesdeCookies, sessionIdDesdeCookies, leerIdsGA } from '@/lib/ga-cliente'

const MEASUREMENT_ID = 'G-4PEDMZN3Q8'

describe('clientIdDesdeCookies', () => {
  it('arma el client_id juntando las dos mitades de la cookie _ga', () => {
    expect(clientIdDesdeCookies('_ga=GA1.1.1234567890.1712345678')).toBe('1234567890.1712345678')
  })

  it('lo encuentra entre otras cookies', () => {
    const cookies = 'bookmist-cart-v1=x; _ga=GA1.2.987.654; _gid=GA1.1.5.5'
    expect(clientIdDesdeCookies(cookies)).toBe('987.654')
  })

  it('sin cookie de Analytics devuelve null en vez de romper', () => {
    expect(clientIdDesdeCookies('')).toBeNull()
    expect(clientIdDesdeCookies('otra=cosa')).toBeNull()
  })

  it('formato inesperado: null (Google puede cambiarlo sin avisar)', () => {
    expect(clientIdDesdeCookies('_ga=GA1.1')).toBeNull()
    expect(clientIdDesdeCookies('_ga=cualquier-cosa')).toBeNull()
    expect(clientIdDesdeCookies('_ga=GA1.1.abc.def')).toBeNull()
  })
})

describe('sessionIdDesdeCookies', () => {
  it('formato nuevo (GS2, con $): saca el session_id de sN', () => {
    const cookies = '_ga_4PEDMZN3Q8=GS2.1.s1757100000$o5$g1$t1757100123$j45$l0$h0'
    expect(sessionIdDesdeCookies(cookies, MEASUREMENT_ID)).toBe('1757100000')
  })

  it('formato viejo (GS1, separado por puntos)', () => {
    const cookies = '_ga_4PEDMZN3Q8=GS1.1.1757100000.5.1.1757100123.0.0.0'
    expect(sessionIdDesdeCookies(cookies, MEASUREMENT_ID)).toBe('1757100000')
  })

  it('la cookie del flujo se busca sacándole el "G-" al measurement id', () => {
    const cookies = '_ga_OTROFLUJO=GS2.1.s111$o1'
    expect(sessionIdDesdeCookies(cookies, MEASUREMENT_ID)).toBeNull()
    expect(sessionIdDesdeCookies(cookies, 'G-OTROFLUJO')).toBe('111')
  })

  it('sin cookie del flujo devuelve null', () => {
    expect(sessionIdDesdeCookies('_ga=GA1.1.1.1', MEASUREMENT_ID)).toBeNull()
  })
})

describe('leerIdsGA', () => {
  it('devuelve los dos identificadores cuando están', () => {
    const cookies = '_ga=GA1.1.1234567890.1712345678; _ga_4PEDMZN3Q8=GS2.1.s1757100000$o5'
    expect(leerIdsGA(cookies, MEASUREMENT_ID)).toEqual({
      clientId: '1234567890.1712345678',
      sessionId: '1757100000',
    })
  })

  it('sin Analytics configurado no intenta leer nada', () => {
    const cookies = '_ga=GA1.1.1234567890.1712345678'
    expect(leerIdsGA(cookies, undefined)).toEqual({ clientId: null, sessionId: null })
  })

  it('con Analytics bloqueado por el visitante: los dos en null, sin romper', () => {
    expect(leerIdsGA('', MEASUREMENT_ID)).toEqual({ clientId: null, sessionId: null })
  })
})
