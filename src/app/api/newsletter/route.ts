import { NextResponse } from 'next/server'
import { suscripcionNewsletterSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCuponBienvenida } from '@/lib/configuracion'
import { enviarCuponBienvenida } from '@/lib/email'

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Popup "Suscribite y recibí un cupón" (Fase 8e). Sin verificación de email
// (decisión: un único código general, simple de armar) — por eso, ante un
// email ya suscripto, no se reenvía el mail de nuevo en cada submit: alguien
// podría usar el form público para mandarle mails repetidos a un tercero.
export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json(
      { ok: false, error: 'La suscripción no está disponible en este momento.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
  }

  const parsed = suscripcionNewsletterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Revisá los datos del formulario.' }, { status: 400 })
  }
  const data = parsed.data

  const cupon = await getCuponBienvenida()
  if (!cupon.activo) {
    return NextResponse.json(
      { ok: false, error: 'La suscripción no está disponible en este momento.' },
      { status: 503 },
    )
  }

  const supabase = createAdminClient()
  const email = data.email.trim().toLowerCase()
  const { error } = await supabase.from('suscriptores_newsletter').insert({
    email,
    nombre: data.nombre,
    cumpleanos: data.cumpleanos || null,
    provincia: data.provincia || null,
  })

  if (error) {
    // Email ya suscripto: no es un error para quien completa el form, pero
    // tampoco reenviamos el mail (ver comentario arriba) — `ya_suscripto`
    // le permite al popup mostrar un mensaje honesto en vez de "te mandamos
    // tu cupón" cuando en realidad no se mandó nada nuevo.
    if (error.code === '23505') return NextResponse.json({ ok: true, ya_suscripto: true })
    return NextResponse.json({ ok: false, error: 'No pudimos guardar tu suscripción.' }, { status: 500 })
  }

  const envio = await enviarCuponBienvenida({
    destinatario: email,
    nombre: data.nombre,
    codigo: cupon.codigo,
    pct: cupon.pct,
  })
  // enviarEmail() nunca lanza (para no frenar la suscripción si el mail
  // falla) — pero eso significa que un fallo queda invisible si no se loguea
  // acá. Sin esto, "no me llegó el mail" no se puede diagnosticar nunca.
  if (!envio.sent) {
    console.error(`[newsletter] no se pudo enviar el cupón a ${email}: ${envio.reason}`)
  }

  return NextResponse.json({ ok: true })
}
