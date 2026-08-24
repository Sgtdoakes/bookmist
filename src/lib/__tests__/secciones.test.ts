import { describe, expect, it } from 'vitest'
import { anclaDeBloqueProductos, resolverSeccion } from '@/lib/secciones'

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

describe('anclaDeBloqueProductos', () => {
  it('un bloque de categoría se ancla en su slug, no en el anclaId guardado', () => {
    // El caso real de /productos: el bloque de "Accesorios mágicos" quedó con
    // el anclaId del bloque del que se copió ("accesorios", que es Mundo
    // dragón), pisando el destino de las dos categorías.
    const ancla = anclaDeBloqueProductos({
      fuente: 'categoria',
      categoria: 'accesorios-magicos',
      anclaId: 'accesorios',
    })
    expect(ancla).toBe('accesorios-magicos')
  })

  it('dos categorías distintas nunca comparten ancla', () => {
    const magicos = anclaDeBloqueProductos({ fuente: 'categoria', categoria: 'accesorios-magicos', anclaId: 'accesorios' })
    const dragon = anclaDeBloqueProductos({ fuente: 'categoria', categoria: 'accesorios', anclaId: 'accesorios' })
    expect(magicos).not.toBe(dragon)
  })

  it('las otras fuentes conservan el anclaId guardado (no hay categoría de la cual derivar)', () => {
    expect(anclaDeBloqueProductos({ fuente: 'manual', categoria: '', anclaId: 'kits-literarios' })).toBe('kits-literarios')
    expect(anclaDeBloqueProductos({ fuente: 'destacados', categoria: '', anclaId: 'destacados' })).toBe('destacados')
  })

  it('sin ancla ni categoría no devuelve id (no se emite un id="" en el DOM)', () => {
    expect(anclaDeBloqueProductos({ fuente: 'todos', categoria: '', anclaId: '' })).toBeUndefined()
    // Un bloque de categoría al que todavía no le eligieron categoría tampoco
    // puede anclarse en un slug vacío.
    expect(anclaDeBloqueProductos({ fuente: 'categoria', categoria: '', anclaId: '' })).toBeUndefined()
  })
})
