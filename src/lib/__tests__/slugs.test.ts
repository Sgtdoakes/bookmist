import { describe, expect, it } from 'vitest'
import { esSlugValido, generarSlug } from '@/lib/slugs'

describe('generarSlug', () => {
  it('pasa a minúsculas y separa palabras con un guion', () => {
    expect(generarSlug('Kit Terror en la Bruma')).toBe('kit-terror-en-la-bruma')
  })

  it('saca tildes y diacríticos', () => {
    expect(generarSlug('Caja Manga · Edición Luna')).toBe('caja-manga-edicion-luna')
  })

  it('colapsa espacios/puntuación consecutivos en un solo guion', () => {
    expect(generarSlug('Kit   Thriller---Nocturno!!')).toBe('kit-thriller-nocturno')
  })

  it('recorta guiones al inicio y al final', () => {
    expect(generarSlug('  Set de Marcapáginas  ')).toBe('set-de-marcapaginas')
  })
})

describe('esSlugValido', () => {
  it('acepta un slug bien formado', () => {
    expect(esSlugValido('kit-terror-en-la-bruma')).toBe(true)
  })

  it('rechaza mayúsculas', () => {
    expect(esSlugValido('Kit-Terror')).toBe(false)
  })

  it('rechaza espacios', () => {
    expect(esSlugValido('kit terror')).toBe(false)
  })

  it('rechaza guiones dobles o al borde', () => {
    expect(esSlugValido('kit--terror')).toBe(false)
    expect(esSlugValido('-kit-terror-')).toBe(false)
  })

  it('todo slug generado por generarSlug es válido', () => {
    expect(esSlugValido(generarSlug('Caja Manga · Edición Luna'))).toBe(true)
  })
})
