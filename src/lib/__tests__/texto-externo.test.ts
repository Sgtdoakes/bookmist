import { describe, expect, it } from 'vitest'
import { limpiarTextoExterno } from '@/lib/texto-externo'

describe('limpiarTextoExterno', () => {
  it('decodifica las entidades numéricas que trae el catálogo de Martín Libros', () => {
    // Caso real, visto al cargar "Alas de sangre": sin esto el cliente lee
    // literalmente "pasion&#8230;" en la ficha del libro.
    expect(limpiarTextoExterno('Amistad, rivalidad y pasion&#8230;')).toBe(
      'Amistad, rivalidad y pasion…',
    )
    expect(limpiarTextoExterno('caf&#xe9;')).toBe('café')
  })

  it('decodifica las entidades nombradas más comunes', () => {
    expect(limpiarTextoExterno('Tolkien &amp; Lewis')).toBe('Tolkien & Lewis')
    expect(limpiarTextoExterno('&ldquo;Ella&rdquo; dijo&hellip;')).toBe('“Ella” dijo…')
  })

  it('deja intacta una entidad que no conoce, en vez de comérsela', () => {
    expect(limpiarTextoExterno('100 &euros; por tomo')).toBe('100 &euros; por tomo')
  })

  it('saca las etiquetas HTML de las descripciones de Google Books', () => {
    expect(limpiarTextoExterno('<p>Un dragón</p><p>y su jinete</p>')).toBe('Un dragón\n\ny su jinete')
    expect(limpiarTextoExterno('Primera línea<br>Segunda línea')).toBe('Primera línea\nSegunda línea')
    expect(limpiarTextoExterno('<b>Negrita</b> y <i>cursiva</i>')).toBe('Negrita y cursiva')
  })

  it('no deja más de una línea en blanco seguida', () => {
    expect(limpiarTextoExterno('<p>Uno</p><br><br><p>Dos</p>')).toBe('Uno\n\nDos')
  })

  it('devuelve null para lo vacío y para lo que no es texto', () => {
    expect(limpiarTextoExterno(null)).toBeNull()
    expect(limpiarTextoExterno(undefined)).toBeNull()
    expect(limpiarTextoExterno('   ')).toBeNull()
    expect(limpiarTextoExterno('<p></p>')).toBeNull()
  })

  it('no rompe con un código de carácter inválido', () => {
    expect(limpiarTextoExterno('roto &#999999999; igual')).toBe('roto  igual')
  })
})
