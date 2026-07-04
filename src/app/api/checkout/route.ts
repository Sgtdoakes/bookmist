import { NextResponse } from 'next/server'
import { checkoutSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { storeConfig } from '@/lib/store-config'
import { whatsappLink, construirMensajePedido, type DatosPedidoMensaje } from '@/lib/whatsapp'
import { notificarPedidoNuevo } from '@/lib/email'
import { getReservasActivas } from '@/lib/reservas'
import { mpConfigured, crearPreferencia } from '@/lib/mercadopago'
import type { OrderItemInsert } from '@/types/db'

type LineaValidada = {
  producto: {
    id: string
    nombre: string
    precio: number
    stock: number
    activo: boolean
  }
  cantidad: number
}

function configured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json(
      { ok: false, error: 'El sistema de pedidos todavía no está configurado.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Revisá los datos del formulario.', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const data = parsed.data

  // Si elige Mercado Pago pero no está configurado, avisamos antes de crear nada.
  if (data.metodo_pago === 'mercadopago' && !mpConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'El pago con Mercado Pago no está disponible en este momento. Elegí otro método.',
      },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()

  // 1) Traer los productos reales (precio/stock autoritativos, no los del cliente).
  const ids = data.items.map((i) => i.producto_id)
  const { data: productos, error: productosErr } = await supabase
    .from('productos')
    .select('id,nombre,precio,stock,activo')
    .in('id', ids)
  if (productosErr) {
    return NextResponse.json({ ok: false, error: 'No pudimos validar el carrito.' }, { status: 500 })
  }

  // Reservas ya tomadas por otros pedidos activos: disponible = stock − reservado.
  const reservado = await getReservasActivas(ids)
  const byId = new Map((productos ?? []).map((p) => [p.id, p]))
  const itemsValidados: LineaValidada[] = []
  for (const it of data.items) {
    const p = byId.get(it.producto_id)
    if (!p || !p.activo) {
      return NextResponse.json(
        { ok: false, error: 'Una caja/kit de tu carrito ya no está disponible.' },
        { status: 409 },
      )
    }
    const disponible = p.stock - (reservado[p.id] ?? 0)
    if (disponible < it.cantidad) {
      return NextResponse.json(
        { ok: false, error: `No hay disponibilidad de "${p.nombre}" (ya está reservado).` },
        { status: 409 },
      )
    }
    itemsValidados.push({ producto: p, cantidad: it.cantidad })
  }

  const subtotal = itemsValidados.reduce((acc, x) => acc + x.producto.precio * x.cantidad, 0)

  // 2) Costo de envío según la zona elegida (Fase 4a: manual; la API real de
  // Andreani es Fase 4b, cuando exista el contrato).
  const { data: zona } = await supabase
    .from('zonas_envio')
    .select('nombre,costo')
    .eq('id', data.zona_id)
    .eq('activo', true)
    .maybeSingle()
  if (!zona) {
    return NextResponse.json(
      { ok: false, error: 'La zona de envío elegida ya no está disponible.' },
      { status: 400 },
    )
  }
  const costoEnvio = Number(zona.costo)
  const total = subtotal + costoEnvio

  // 3) Crear el pedido (service role: ignora RLS).
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      cliente_nombre: data.cliente_nombre,
      cliente_email: data.cliente_email,
      cliente_telefono: data.cliente_telefono,
      direccion_envio: data.direccion_envio,
      zona_envio: zona.nombre,
      costo_envio: costoEnvio,
      metodo_pago: data.metodo_pago,
      estado: 'pendiente',
      total,
      notas: data.notas ?? null,
    })
    .select('id,numero_pedido')
    .single()
  if (orderErr || !order) {
    return NextResponse.json({ ok: false, error: 'No pudimos registrar el pedido.' }, { status: 500 })
  }

  // 4) Items con snapshot de nombre y precio.
  const itemsInsert: OrderItemInsert[] = itemsValidados.map((x) => ({
    order_id: order.id,
    producto_id: x.producto.id,
    nombre: x.producto.nombre,
    precio_unitario: x.producto.precio,
    cantidad: x.cantidad,
  }))
  const { error: itemsErr } = await supabase.from('order_items').insert(itemsInsert)
  if (itemsErr) {
    // Best-effort: si fallan los items, borramos el pedido para no dejar basura.
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json(
      { ok: false, error: 'No pudimos registrar el detalle del pedido.' },
      { status: 500 },
    )
  }

  // 5) Si paga con Mercado Pago, creamos la preferencia (Checkout Pro).
  let mpInitPoint: string | null = null
  if (data.metodo_pago === 'mercadopago') {
    const pref = await crearPreferencia({
      orderId: order.id,
      numeroPedido: order.numero_pedido,
      items: itemsValidados.map((x) => ({
        nombre: x.producto.nombre,
        precio: x.producto.precio,
        cantidad: x.cantidad,
      })),
      costoEnvio,
      emailCliente: data.cliente_email,
    })
    if (!pref) {
      // Limpiamos el pedido para no dejar uno colgado (cascade borra los items).
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        {
          ok: false,
          error: 'No pudimos iniciar el pago con Mercado Pago. Probá de nuevo o elegí otro método.',
        },
        { status: 502 },
      )
    }
    mpInitPoint = pref.init_point
    await supabase.from('orders').update({ mp_preference_id: pref.id }).eq('id', order.id)
  }

  // 6) Link de WhatsApp + email a Daniela (no frena el pedido si falla).
  const datosMsg: DatosPedidoMensaje = {
    numeroPedido: order.numero_pedido,
    clienteNombre: data.cliente_nombre,
    clienteTelefono: data.cliente_telefono,
    items: itemsValidados.map((x) => ({
      nombre: x.producto.nombre,
      cantidad: x.cantidad,
      precio_unitario: x.producto.precio,
    })),
    direccionEnvio: data.direccion_envio,
    zonaEnvio: zona.nombre,
    costoEnvio,
    metodoPago: data.metodo_pago,
    total,
    notas: data.notas ?? null,
  }
  const waUrl = storeConfig.whatsapp
    ? whatsappLink(storeConfig.whatsapp, construirMensajePedido(datosMsg))
    : null
  await notificarPedidoNuevo(datosMsg, waUrl ?? '(WhatsApp no configurado)')

  return NextResponse.json({
    ok: true,
    numero_pedido: order.numero_pedido,
    whatsapp_url: waUrl,
    total,
    mp_init_point: mpInitPoint,
  })
}
