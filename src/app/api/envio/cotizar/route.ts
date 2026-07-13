import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/public'
import { andreaniConfigured, cotizarEnvioDomicilio, normalizarCP } from '@/lib/andreani'

// Cotiza el envío del carrito a un CP, en vivo contra Andreani. El precio
// que devuelve es informativo para la UI del checkout — al confirmar el
// pedido, /api/checkout vuelve a cotizar del lado del servidor con los
// productos reales (nunca se confía en el costo que diga el navegador).

const schema = z.object({
  cp: z.string().min(4).max(10),
  items: z
    .array(z.object({ producto_id: z.string().uuid(), cantidad: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50),
})

export async function POST(request: Request) {
  if (!andreaniConfigured()) {
    return NextResponse.json({ ok: false, error: 'Cotización no disponible.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
  }
  const cp = normalizarCP(parsed.data.cp)
  if (!cp) {
    return NextResponse.json({ ok: false, error: 'Ingresá un código postal válido (4 dígitos).' }, { status: 400 })
  }

  // Peso/medidas reales desde la base — el carrito del navegador solo manda ids.
  const supabase = createClient()
  const ids = parsed.data.items.map((i) => i.producto_id)
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, precio, peso_gramos, alto_cm, ancho_cm, largo_cm')
    .in('id', ids)
    .eq('activo', true)
  if (error || !productos || productos.length !== ids.length) {
    return NextResponse.json({ ok: false, error: 'No pudimos validar el carrito.' }, { status: 409 })
  }

  const porId = new Map(productos.map((p) => [p.id, p]))
  const bultos = parsed.data.items.map((it) => {
    const p = porId.get(it.producto_id)!
    return {
      cantidad: it.cantidad,
      precio: p.precio,
      peso_gramos: p.peso_gramos,
      alto_cm: p.alto_cm,
      ancho_cm: p.ancho_cm,
      largo_cm: p.largo_cm,
    }
  })

  const costo = await cotizarEnvioDomicilio(cp, bultos)
  if (costo == null) {
    return NextResponse.json(
      { ok: false, error: 'No pudimos cotizar a ese código postal. Revisalo o probá de nuevo.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, cp, costo })
}
