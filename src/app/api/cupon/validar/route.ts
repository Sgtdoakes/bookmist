import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCupon, mensajeRechazoCupon } from '@/lib/cupon'
import type { MetodoPago } from '@/types/db'

// Verificación en vivo del cupón durante el checkout (mismo patrón que
// /api/envio/cotizar) — solo para mostrarle el descuento al cliente ANTES
// de confirmar; el pedido en sí se revalida siempre server-side en
// /api/checkout con la misma lógica (validarCupon), esto es puramente
// feedback de UI.
//
// El email va si está, pero no es obligatorio: desde la Fase 8i cada cupón
// dice si lo necesita. Los que se reparten en la calle no piden nada, y
// exigir el mail para validarlos era pedirle un dato de más a alguien que
// solo quiere saber si el papelito que encontró sirve. Si el cupón SÍ lo
// necesita, validarCupon devuelve el motivo 'falta_email' y el mensaje se lo
// pide.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cupón inválido.' }, { status: 400 })
  }

  const parsed = body as { codigo?: unknown; email?: unknown; metodo_pago?: unknown }
  const codigo = typeof parsed?.codigo === 'string' ? parsed.codigo : ''
  const email = typeof parsed?.email === 'string' ? parsed.email : ''
  // El medio de pago llega desde el formulario (que siempre tiene uno
  // elegido) para poder contestar en el acto si el cupón es de los que piden
  // transferencia. Se acepta solo si es un valor conocido: cualquier otra
  // cosa se ignora y el cupón se valida sin esa regla.
  const METODOS: MetodoPago[] = ['transferencia', 'efectivo', 'mercadopago', 'deposito']
  const metodoPago = METODOS.find((m) => m === parsed?.metodo_pago)
  if (!codigo.trim()) return NextResponse.json({ ok: false, error: 'Escribí un código.' }, { status: 400 })

  const supabase = createAdminClient()
  const validacion = await validarCupon(supabase, codigo, email, metodoPago)
  if (!validacion.ok) {
    // 400 cuando falta un dato que el cliente puede completar, 404 cuando el
    // cupón directamente no le sirve. El medio de pago equivocado es de los
    // primeros: cambia el medio y el mismo cupón anda.
    const status =
      validacion.motivo === 'falta_email' || validacion.motivo === 'otro_medio_pago' ? 400 : 404
    return NextResponse.json(
      { ok: false, error: mensajeRechazoCupon(validacion), motivo: validacion.motivo },
      { status },
    )
  }

  return NextResponse.json({ ok: true, pct: validacion.pct })
}
