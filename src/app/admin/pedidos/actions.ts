'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ajustarStockPedido } from '@/lib/pedidos'
import { ESTADO_SIGUIENTE } from '@/lib/constants'
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

  const { data: actual } = await supabase.from('orders').select('estado').eq('id', id).maybeSingle()
  if (!actual) return { ok: false, error: 'El pedido no existe.' }
  if (!ESTADO_SIGUIENTE[actual.estado].includes(estado)) {
    return { ok: false, error: 'Ese cambio de estado no está permitido.' }
  }

  const { error } = await supabase.from('orders').update({ estado, leido: true }).eq('id', id)
  if (error) return { ok: false, error: 'No se pudo actualizar el pedido.' }

  // Al confirmar el pago se descuenta el stock de verdad; si un pedido ya
  // pagado se cancela, se repone (ver src/lib/pedidos.ts).
  if (estado === 'pagado') {
    await ajustarStockPedido(supabase, id, -1)
  } else if (estado === 'cancelado' && actual.estado === 'pagado') {
    await ajustarStockPedido(supabase, id, 1)
  }

  revalidarPublico()
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
