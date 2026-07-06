import { describe, expect, it } from 'vitest'
import { decidirTransicionMantenimiento } from '@/lib/mantenimiento'

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
