import { describe, expect, it } from 'vitest'
import { resolverSeccion } from '@/lib/secciones'

describe('resolverSeccion', () => {
  it('usa los valores por defecto cuando no hay config guardada', () => {
    const s = resolverSeccion('hero', {})
    expect(s.config.titulo).toBe('Palabras que se sienten en las manos')
    expect(s.config.ctaTexto).toBe('Descubrir los kits')
  })

  it('un campo guardado pisa el valor por defecto', () => {
    const s = resolverSeccion('hero', { titulo: 'Un título nuevo' })
    expect(s.config.titulo).toBe('Un título nuevo')
    // Los campos no tocados siguen usando el default.
    expect(s.config.ctaTexto).toBe('Descubrir los kits')
  })

  it('no rompe si la config guardada tiene un campo de más (versión vieja del esquema)', () => {
    const s = resolverSeccion('categorias', { eyebrow: 'Mirá', campoQueYaNoExiste: 'x' } as never)
    expect(s.config.eyebrow).toBe('Mirá')
    expect(s.config.titulo).toBe('Nuestras categorías')
  })

  it('reemplaza la lista completa de ítems en vez de mezclarla (beneficios)', () => {
    const s = resolverSeccion('beneficios', { items: [{ emoji: '🎉', texto: 'Uno solo' }] })
    expect(s.config.items).toEqual([{ emoji: '🎉', texto: 'Uno solo' }])
  })

  it('el título de instagram por defecto usa el handle configurado', () => {
    const s = resolverSeccion('instagram', {})
    expect(s.config.titulo).toContain('Seguinos en')
  })
})
