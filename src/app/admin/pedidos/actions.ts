'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ajustarStockPedido } from '@/lib/pedidos'
import { ESTADO_SIGUIENTE, ESTADOS_CON_STOCK_DESCONTADO } from '@/lib/constants'
import { enviarCambioEstado } from '@/lib/email'
import type { EstadoPedido } from '@/types/db'

type Ok = { ok: true }
type Err = { ok: false; error: string }

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidarPublico() {
  revalidatePath('/')
  revalidatePath('/productos')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/productos')
}

export async function cambiarEstadoPedido(id: string, estado: EstadoPedido): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { data: actual } = await supabase
    .from('orders')
    .select('estado,numero_pedido,cliente_nombre,cliente_email,token_consulta,seguimiento,total')
    .eq('id', id)
    .maybeSingle()
  if (!actual) return { ok: false, error: 'El pedido no existe.' }
  if (!ESTADO_SIGUIENTE[actual.estado].includes(estado)) {
    return { ok: false, error: 'Ese cambio de estado no está permitido.' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ estado, leido: true, estado_actualizado_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: 'No se pudo actualizar el pedido.' }

  // Al confirmar el pago se descuenta el stock de verdad; si un pedido que ya
  // lo tenía descontado se cancela, se repone (ver src/lib/pedidos.ts).
  // 'enviado'/'entregado' no lo tocan: vienen después de 'pagado', que ya
  // descontó. Si el ajuste falla, el estado ya cambió: se avisa para corregir
  // el stock a mano en vez de fallar en silencio (lección del pedido BM-0003).
  if (estado === 'pagado') {
    const stockOk = await ajustarStockPedido(supabase, id, -1)
    if (!stockOk) {
      return { ok: false, error: 'El pedido quedó pagado, pero no se pudo descontar el stock — revisalo a mano.' }
    }
  } else if (estado === 'cancelado' && ESTADOS_CON_STOCK_DESCONTADO.includes(actual.estado)) {
    const stockOk = await ajustarStockPedido(supabase, id, 1)
    if (!stockOk) {
      return { ok: false, error: 'El pedido quedó cancelado, pero no se pudo reponer el stock — revisalo a mano.' }
    }
  }

  // Aviso al cliente. Best-effort y nunca en silencio: el estado ya cambió,
  // así que un mail caído no puede devolver error (Dani vería un fallo sobre
  // algo que en realidad funcionó), pero queda en los logs de Vercel.
  const aviso = await enviarCambioEstado({
    numeroPedido: actual.numero_pedido,
    token: actual.token_consulta,
    clienteNombre: actual.cliente_nombre,
    clienteEmail: actual.cliente_email,
    estado,
    seguimiento: actual.seguimiento,
    total: actual.total,
  })
  if (!aviso.sent) {
    console.error(`[pedidos] aviso de "${estado}" NO enviado (${actual.numero_pedido}):`, aviso.reason)
  }

  revalidarPublico()
  return { ok: true }
}

// Número de envío de Andreani, cargado a mano (la integración solo cotiza, no
// despacha — ver src/lib/andreani.ts). Guardarlo NO manda ningún mail a
// propósito: el aviso sale al marcar el pedido como enviado, y ahí ya viaja
// con este número adentro. Así Dani puede pegarlo, revisarlo y recién después
// avisar, en vez de disparar un mail por cada tecla.
export async function guardarSeguimiento(id: string, seguimiento: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const limpio = seguimiento.trim()
  const { error } = await supabase
    .from('orders')
    .update({ seguimiento: limpio || null })
    .eq('id', id)
  if (error) return { ok: false, error: 'No se pudo guardar el número de seguimiento.' }

  revalidatePath('/admin/pedidos')
  return { ok: true }
}

export async function marcarLeido(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('orders').update({ leido: true }).eq('id', id)
  if (error) return { ok: false, error: 'No se pudo marcar el pedido.' }

  revalidatePath('/admin/pedidos')
  return { ok: true }
}
