import { describe, expect, it } from 'vitest'
import { armarCsv, escaparCampoCsv, sufijoFechaArchivo } from '@/lib/csv'

describe('escaparCampoCsv', () => {
  it('deja pasar el texto simple sin tocarlo', () => {
    expect(escaparCampoCsv('Ana Pérez')).toBe('Ana Pérez')
  })

  it('entrecomilla cuando hay punto y coma (el separador)', () => {
    // Sin esto, "Pérez; Ana" corre todas las columnas de esa fila un lugar a
    // la derecha en Excel.
    expect(escaparCampoCsv('Pérez; Ana')).toBe('"Pérez; Ana"')
  })

  it('duplica las comillas internas', () => {
    expect(escaparCampoCsv('Kit "Invierno"')).toBe('"Kit ""Invierno"""')
  })

  it('entrecomilla los saltos de línea', () => {
    expect(escaparCampoCsv('Calle 1\nDepto 2')).toBe('"Calle 1\nDepto 2"')
  })

  it('null y undefined quedan como celda vacía', () => {
    expect(escaparCampoCsv(null)).toBe('')
    expect(escaparCampoCsv(undefined)).toBe('')
  })

  it('los números se escriben tal cual', () => {
    expect(escaparCampoCsv(0)).toBe('0')
    expect(escaparCampoCsv(15)).toBe('15')
  })
})

describe('armarCsv', () => {
  it('separa columnas con punto y coma y filas con CRLF', () => {
    const csv = armarCsv([
      ['Email', 'Nombre'],
      ['ana@mail.com', 'Ana'],
    ])
    expect(csv).toBe('Email;Nombre\r\nana@mail.com;Ana')
  })

  it('una fila con un campo problemático no descoloca al resto', () => {
    const csv = armarCsv([
      ['Nombre', 'Provincia'],
      ['Pérez; Ana', 'Buenos Aires'],
      ['Juan', 'Córdoba'],
    ])
    expect(csv.split('\r\n')).toEqual(['Nombre;Provincia', '"Pérez; Ana";Buenos Aires', 'Juan;Córdoba'])
  })

  it('lista vacía devuelve texto vacío', () => {
    expect(armarCsv([])).toBe('')
  })
})

describe('sufijoFechaArchivo', () => {
  it('arma la fecha con ceros adelante para que ordene bien alfabéticamente', () => {
    expect(sufijoFechaArchivo(new Date(2026, 7, 7))).toBe('2026-08-07')
    expect(sufijoFechaArchivo(new Date(2026, 11, 25))).toBe('2026-12-25')
  })
})
