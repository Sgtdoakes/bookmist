import { describe, expect, it } from 'vitest'
import { fichaTecnicaDeLibro, formatoLegible } from '@/lib/libro'
import type { Producto } from '@/types/db'

function producto(patch: Partial<Producto> = {}): Producto {
  return {
    id: 'p1',
    slug: 'alas-de-sangre',
    nombre: 'Alas de sangre',
    tipo: 'libro',
    autor: 'Rebecca Yarros',
    editorial: 'Planeta',
    isbn: '9788408270331',
    paginas: 712,
    anio_publicacion: 2023,
    idioma: 'Español',
    formato: 'blanda',
    descripcion: null,
    precio: 61900,
    stock: 3,
    imagen_principal: null,
    imagenes_galeria: [],
    peso_gramos: 450,
    alto_cm: 3,
    ancho_cm: 15,
    largo_cm: 22,
    variante_grupo_id: null,
    variante_etiqueta: null,
    activo: true,
    orden: 0,
    created_at: '2026-09-17T00:00:00Z',
    updated_at: '2026-09-17T00:00:00Z',
    ...patch,
  }
}

describe('formatoLegible', () => {
  it('traduce lo que guarda la base a lo que se lee en la ficha', () => {
    expect(formatoLegible('blanda')).toBe('Tapa blanda')
    expect(formatoLegible('dura')).toBe('Tapa dura')
  })

  it('devuelve null para null o cualquier otra cosa', () => {
    expect(formatoLegible(null)).toBeNull()
    expect(formatoLegible('cuero repujado')).toBeNull()
  })
})

describe('fichaTecnicaDeLibro', () => {
  it('arma las filas en orden, con el ISBN al final', () => {
    expect(fichaTecnicaDeLibro(producto())).toEqual([
      { etiqueta: 'Editorial', valor: 'Planeta' },
      { etiqueta: 'Páginas', valor: '712' },
      { etiqueta: 'Año', valor: '2023' },
      { etiqueta: 'Idioma', valor: 'Español' },
      { etiqueta: 'Encuadernación', valor: 'Tapa blanda' },
      { etiqueta: 'ISBN', valor: '9788408270331' },
    ])
  })

  it('saltea los datos que no se cargaron', () => {
    const filas = fichaTecnicaDeLibro(
      producto({ editorial: null, paginas: null, idioma: null, formato: null }),
    )
    expect(filas).toEqual([
      { etiqueta: 'Año', valor: '2023' },
      { etiqueta: 'ISBN', valor: '9788408270331' },
    ])
  })

  it('no devuelve nada si el producto no es un libro', () => {
    // Una caja puede tener autor cargado (quedó de la biblioteca vieja) y no
    // por eso le corresponde una ficha técnica.
    expect(fichaTecnicaDeLibro(producto({ tipo: 'caja' }))).toEqual([])
  })

  it('devuelve vacío cuando es un libro sin ningún dato cargado: la ficha se oculta entera', () => {
    const pelado = producto({
      editorial: null,
      isbn: null,
      paginas: null,
      anio_publicacion: null,
      idioma: null,
      formato: null,
    })
    expect(fichaTecnicaDeLibro(pelado)).toEqual([])
  })
})
