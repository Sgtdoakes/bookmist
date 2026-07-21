import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCupon, CUPON_MOTIVO_MENSAJE } from '@/lib/cupon'

// Verificación en vivo del cupón durante el checkout (mismo patrón que
// /api/envio/cotizar) — solo para mostrarle el descuento al cliente ANTES
// de confirmar; el pedido en sí se revalida siempre server-side en
// /api/checkout con la misma lógica (validarCupon), esto es puramente
// feedback de UI. Necesita el email de quien compra porque el cupón está
// atado a haberse suscripto y a no haberlo usado ya (ver src/lib/cupon.ts).
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cupón inválido.' }, { status: 400 })
  }

  const parsed = body as { codigo?: unknown; email?: unknown }
  const codigo = typeof parsed?.codigo === 'string' ? parsed.codigo : ''
  const email = typeof parsed?.email === 'string' ? parsed.email : ''
  if (!codigo.trim()) return NextResponse.json({ ok: false, error: 'Escribí un código.' }, { status: 400 })
  if (!email.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Completá tu email primero para poder validar el cupón.' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const validacion = await validarCupon(supabase, codigo, email)
  if (!validacion.ok) {
    return NextResponse.json({ ok: false, error: CUPON_MOTIVO_MENSAJE[validacion.motivo] }, { status: 404 })
  }

  return NextResponse.json({ ok: true, pct: validacion.pct })
}
