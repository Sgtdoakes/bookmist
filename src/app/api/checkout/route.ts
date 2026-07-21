import { NextResponse } from 'next/server'
import { checkoutSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { aplicarEnvioGratis, getDescuentoTransferenciaPct, getEnvioConfig, getMarcaConfig } from '@/lib/configuracion'
import { validarCupon, type CuponMotivoRechazo } from '@/lib/cupon'
import { whatsappLink, construirMensajePedido, type DatosPedidoMensaje } from '@/lib/whatsapp'
import { notificarPedidoNuevo } from '@/lib/email'
import { avisarWhatsAppDani } from '@/lib/notificaciones'
import { getReservasActivas } from '@/lib/reservas'
import { mpConfigured, crearPreferencia } from '@/lib/mercadopago'
import { andreaniConfigured, cotizarEnvioDomicilio } from '@/lib/andreani'
import type { OrderItemInsert } from '@/types/db'

type LineaValidada = {
  producto: {
    id: string
    nombre: string
    precio: number
    stock: number
    activo: boolean
    peso_gramos: number
    alto_cm: number
    ancho_cm: number
    largo_cm: number
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

  // 1) Traer los productos reales (precio/stock autoritativos, no los del
  // cliente; peso/medidas para la cotización de Andreani).
  const ids = data.items.map((i) => i.producto_id)
  const { data: productos, error: productosErr } = await supabase
    .from('productos')
    .select('id,nombre,precio,stock,activo,peso_gramos,alto_cm,ancho_cm,largo_cm')
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

  // 2) Costo de envío (Fase 6k: retiro en persona y envío gratis por
  // umbral). Camino principal con domicilio: cotización en vivo de Andreani
  // por CP (Fase 6d) — se RE-cotiza acá con los productos reales, nunca se
  // confía en el precio que haya visto el navegador. Respaldo: zona manual.
  const envioCfg = await getEnvioConfig()
  let costoEnvio: number
  let zonaNombre: string
  let direccionEnvio = data.direccion_envio
  if (data.modo_envio === 'retiro') {
    if (!envioCfg.retiroActivo) {
      return NextResponse.json(
        { ok: false, error: 'El retiro en persona no está disponible en este momento.' },
        { status: 400 },
      )
    }
    costoEnvio = 0
    zonaNombre = envioCfg.retiroEtiqueta
    direccionEnvio = envioCfg.retiroEtiqueta
  } else if (data.cp_envio && andreaniConfigured()) {
    const cotizado = await cotizarEnvioDomicilio(
      data.cp_envio,
      itemsValidados.map((x) => ({
        cantidad: x.cantidad,
        precio: x.producto.precio,
        peso_gramos: x.producto.peso_gramos,
        alto_cm: x.producto.alto_cm,
        ancho_cm: x.producto.ancho_cm,
        largo_cm: x.producto.largo_cm,
      })),
    )
    if (cotizado == null) {
      return NextResponse.json(
        { ok: false, error: 'No pudimos cotizar el envío a ese código postal. Probá de nuevo.' },
        { status: 502 },
      )
    }
    costoEnvio = cotizado
    zonaNombre = `Andreani a domicilio (CP ${data.cp_envio})`
  } else {
    const { data: zona } = await supabase
      .from('zonas_envio')
      .select('nombre,costo')
      .eq('id', data.zona_id ?? '')
      .eq('activo', true)
      .maybeSingle()
    if (!zona) {
      return NextResponse.json(
        { ok: false, error: 'La zona de envío elegida ya no está disponible.' },
        { status: 400 },
      )
    }
    costoEnvio = Number(zona.costo)
    zonaNombre = zona.nombre
  }

  // Envío gratis por umbral (solo domicilio — el retiro ya es $0). Se anota
  // en el nombre para que Dani vea en el panel que el $0 fue a propósito.
  if (data.modo_envio !== 'retiro') {
    const conGratis = aplicarEnvioGratis(subtotal, envioCfg.envioGratisUmbral, costoEnvio)
    if (conGratis === 0 && costoEnvio > 0) zonaNombre += ' — envío gratis'
    costoEnvio = conGratis
  }

  // 2b) Descuento por transferencia (la promesa de la barra de beneficios):
  // se aplica sobre el subtotal de productos — el envío se cobra completo.
  const pctDescuentoTransferencia = data.metodo_pago === 'transferencia' ? await getDescuentoTransferenciaPct() : 0

  // 2c) Cupón de bienvenida (Fase 8e) — el código lo manda el navegador,
  // pero SIEMPRE se revalida acá contra la config real y contra dos
  // condiciones anti-abuso (nunca se confía en nada que venga del cliente):
  // el email de quien compra tiene que estar suscripto, y no puede haber
  // usado ya un cupón en un pedido anterior (ver validarCupon() en
  // src/lib/cupon.ts). Se combina con el descuento por transferencia (ambos
  // se suman sobre el subtotal).
  let cuponCodigoAplicado: string | null = null
  let pctDescuentoCupon = 0
  let cuponMotivoRechazo: CuponMotivoRechazo | null = null
  if (data.cupon?.trim()) {
    const validacion = await validarCupon(supabase, data.cupon, data.cliente_email)
    if (validacion.ok) {
      cuponCodigoAplicado = data.cupon.trim().toUpperCase()
      pctDescuentoCupon = validacion.pct
    } else {
      cuponMotivoRechazo = validacion.motivo
    }
  }

  const descuento = Math.round(subtotal * ((pctDescuentoTransferencia + pctDescuentoCupon) / 100))
  const total = subtotal - descuento + costoEnvio

  // 3) Crear el pedido (service role: ignora RLS).
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      cliente_nombre: data.cliente_nombre,
      cliente_email: data.cliente_email,
      cliente_telefono: data.cliente_telefono,
      direccion_envio: direccionEnvio,
      zona_envio: zonaNombre,
      costo_envio: costoEnvio,
      metodo_pago: data.metodo_pago,
      estado: 'pendiente',
      descuento,
      cupon_codigo: cuponCodigoAplicado,
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

  // 6) Avisos a Daniela: email + WhatsApp personal (best-effort, un aviso
  // caído nunca frena el pedido).
  const datosMsg: DatosPedidoMensaje = {
    numeroPedido: order.numero_pedido,
    clienteNombre: data.cliente_nombre,
    clienteTelefono: data.cliente_telefono,
    items: itemsValidados.map((x) => ({
      nombre: x.producto.nombre,
      cantidad: x.cantidad,
      precio_unitario: x.producto.precio,
    })),
    direccionEnvio,
    zonaEnvio: zonaNombre,
    costoEnvio,
    metodoPago: data.metodo_pago,
    descuento,
    cuponCodigo: cuponCodigoAplicado,
    total,
    notas: data.notas ?? null,
  }
  const marca = await getMarcaConfig()
  const waUrl = marca.whatsapp ? whatsappLink(marca.whatsapp, construirMensajePedido(datosMsg)) : null
  await notificarPedidoNuevo(datosMsg, waUrl ?? '(WhatsApp no configurado)')
  await avisarWhatsAppDani(`🛍️ ${construirMensajePedido(datosMsg)}`)

  return NextResponse.json({
    ok: true,
    numero_pedido: order.numero_pedido,
    whatsapp_url: waUrl,
    total,
    mp_init_point: mpInitPoint,
    // Para que el checkout avise por qué el código que tipeó no se aplicó —
    // la validación real (arriba) es la única fuente de verdad, esto es solo
    // feedback de UI post-submit.
    cupon_aplicado: cuponCodigoAplicado !== null,
    cupon_motivo: cuponMotivoRechazo,
  })
}
