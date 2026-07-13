import { describe, expect, it } from 'vitest'
import { decidirTransicionMantenimiento, entornoDeHost } from '@/lib/mantenimiento'

describe('entornoDeHost', () => {
  it('clasifica bookmist.vercel.app como "pruebas"', () => {
    expect(entornoDeHost('bookmist.vercel.app')).toBe('pruebas')
  })

  it('clasifica cualquier URL de preview de Vercel como "pruebas"', () => {
    expect(entornoDeHost('bookmist-git-fase6k-usuario.vercel.app')).toBe('pruebas')
  })

  it('clasifica el dominio propio como "producción"', () => {
    expect(entornoDeHost('bookmist.com.ar')).toBe('produccion')
    expect(entornoDeHost('www.bookmist.com.ar')).toBe('produccion')
  })

  it('clasifica localhost como "producción" (desarrollo local)', () => {
    expect(entornoDeHost('localhost:3000')).toBe('produccion')
  })
})

describe('decidirTransicionMantenimiento', () => {
  it('activa automáticamente cuando no hay stock en ningún producto activo', () => {
    const d = decidirTransicionMantenimiento({
      activoActual: false,
      motivoActual: null,
      hayProductos: true,
      hayStock: false,
    })
    expect(d).toEqual({ accion: 'activar', motivo: 'auto_sin_stock' })
  })

  it('no activa si todavía no hay ningún producto cargado', () => {
    const d = decidirTransicionMantenimiento({
      activoActual: false,
      motivoActual: null,
      hayProductos: false,
      hayStock: false,
    })
    expect(d).toEqual({ accion: 'nada' })
  })

  it('no hace nada si ya está activo (sin importar el motivo) y sigue sin stock', () => {
    const d = decidirTransicionMantenimiento({
      activoActual: true,
      motivoActual: 'auto_sin_stock',
      hayProductos: true,
      hayStock: false,
    })
    expect(d).toEqual({ accion: 'nada' })
  })

  it('desactiva cuando volvió el stock y el motivo fue automático', () => {
    const d = decidirTransicionMantenimiento({
      activoActual: true,
      motivoActual: 'auto_sin_stock',
      hayProductos: true,
      hayStock: true,
    })
    expect(d).toEqual({ accion: 'desactivar' })
  })

  it('NUNCA desactiva una activación manual, aunque vuelva el stock', () => {
    const d = decidirTransicionMantenimiento({
      activoActual: true,
      motivoActual: 'manual',
      hayProductos: true,
      hayStock: true,
    })
    expect(d).toEqual({ accion: 'nada' })
  })

  it('no hace nada si ya está apagado y hay stock disponible', () => {
    const d = decidirTransicionMantenimiento({
      activoActual: false,
      motivoActual: null,
      hayProductos: true,
      hayStock: true,
    })
    expect(d).toEqual({ accion: 'nada' })
  })
})
