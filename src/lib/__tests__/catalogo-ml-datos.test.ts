import { describe, expect, it } from 'vitest'
import { normalizarLibros } from '@/lib/catalogo-ml-datos'

describe('normalizarLibros', () => {
  it('mapea lo que devuelve el servicio de Martín Libros', () => {
    const crudo = [
      {
        isbn: '9788408270331',
        titulo: 'Alas de sangre',
        autor: 'Yarros, Rebecca',
        editorial: 'PLANETA',
        descripcion: 'Un dragón.',
        tapa: 'https://pub-abc.r2.dev/9788408',
        precio: 61900,
      },
    ]
    expect(normalizarLibros(crudo)).toEqual([
      {
        isbn: '9788408270331',
        titulo: 'Alas de sangre',
        autor: 'Yarros, Rebecca',
        editorial: 'PLANETA',
        descripcion: 'Un dragón.',
        tapa: 'https://pub-abc.r2.dev/9788408',
        precio: 61900,
      },
    ])
  })

  it('descarta lo que no tiene título: no sirve para cargar un producto', () => {
    expect(normalizarLibros([{ isbn: '123', titulo: '   ' }, { isbn: '456' }, null, 'texto'])).toEqual([])
  })

  it('convierte los vacíos en null y el precio ausente en 0', () => {
    const [libro] = normalizarLibros([{ titulo: 'Sin datos', autor: '', editorial: null }])
    expect(libro).toEqual({
      isbn: null,
      titulo: 'Sin datos',
      autor: null,
      editorial: null,
      descripcion: null,
      tapa: null,
      precio: 0,
    })
  })

  it('tira cualquier tapa que no sea https', () => {
    // La URL termina guardada en imagen_principal y servida en el sitio: un
    // http:// sería contenido mixto y un javascript: no tiene por qué entrar.
    const tapas = normalizarLibros([
      { titulo: 'A', tapa: 'http://ejemplo.com/tapa.jpg' },
      { titulo: 'B', tapa: 'javascript:alert(1)' },
      { titulo: 'C', tapa: 'no soy una url' },
      { titulo: 'D', tapa: 'https://ejemplo.com/tapa.jpg' },
    ]).map((l) => l.tapa)
    expect(tapas).toEqual([null, null, null, 'https://ejemplo.com/tapa.jpg'])
  })

  it('aguanta que el servicio devuelva cualquier cosa', () => {
    expect(normalizarLibros(undefined)).toEqual([])
    expect(normalizarLibros({ resultados: [] })).toEqual([])
    expect(normalizarLibros('error')).toEqual([])
  })
})
