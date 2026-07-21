import { NextResponse } from 'next/server'
import { getCuponBienvenida } from '@/lib/configuracion'

// Verificación en vivo del cupón durante el checkout (mismo patrón que
// /api/envio/cotizar) — solo para mostrarle el descuento al cliente ANTES
// de confirmar; el pedido en sí se recalcula siempre server-side en
// /api/checkout, esto es puramente feedback de UI.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cupón inválido.' }, { status: 400 })
  }

  const codigo = typeof (body as { codigo?: unknown })?.codigo === 'string' ? (body as { codigo: string }).codigo : ''
  const limpio = codigo.trim().toUpperCase()
  if (!limpio) return NextResponse.json({ ok: false, error: 'Escribí un código.' }, { status: 400 })

  const cupon = await getCuponBienvenida()
  if (!cupon.activo || cupon.codigo !== limpio) {
    return NextResponse.json({ ok: false, error: 'Ese cupón no es válido.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, pct: cupon.pct })
}
