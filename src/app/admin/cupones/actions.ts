'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { codigoBienFormado, generarCodigosUnicos, normalizarCodigo } from '@/lib/cupon-codigo'
import type { Cupon, CuponInsert } from '@/types/db'

type Ok = { ok: true }
type Err = { ok: false; error: string }

const MAX_POR_TANDA = 200

async function clienteAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? supabase : null
}

function revalidar() {
  revalidatePath('/admin/cupones')
}

function pctValido(pct: number): boolean {
  return Number.isInteger(pct) && pct > 0 && pct <= 100
}

export type NuevoCupon = {
  codigo: string
  pct: number
  // null = sin tope. El form del panel manda 1 para los de la calle.
  usosMaximos: number | null
  requiereSuscripcion: boolean
  unaVezPorEmail: boolean
  nota: string
}

// Devuelve la fila creada (no solo `ok`): el panel la agrega a la lista sin
// recargar, y necesita el id REAL que generó Postgres — con un id inventado
// del lado del cliente, el primer "apagar" o "borrar" sobre esa fila no
// coincidiría con ninguna y no haría nada, en silencio.
export async function crearCupon(datos: NuevoCupon): Promise<{ ok: true; cupon: Cupon } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const codigo = normalizarCodigo(datos.codigo)
  if (!codigo) return { ok: false, error: 'Escribí un código.' }
  if (!codigoBienFormado(codigo)) {
    return { ok: false, error: 'El código solo puede tener letras, números y guiones (sin espacios ni símbolos).' }
  }
  if (!pctValido(datos.pct)) return { ok: false, error: 'El descuento tiene que ser un número entero entre 1 y 100.' }
  if (datos.usosMaximos != null && (!Number.isInteger(datos.usosMaximos) || datos.usosMaximos < 1)) {
    return { ok: false, error: 'El límite de usos tiene que ser 1 o más.' }
  }

  const fila: CuponInsert = {
    codigo,
    pct: datos.pct,
    activo: true,
    usos_maximos: datos.usosMaximos,
    requiere_suscripcion: datos.requiereSuscripcion,
    una_vez_por_email: datos.unaVezPorEmail,
    nota: datos.nota.trim() || null,
  }
  const { data: creado, error } = await supabase.from('cupones').insert(fila).select('*').single()
  if (error || !creado) {
    // 23505 = unique violation sobre `codigo`.
    if (error?.code === '23505') return { ok: false, error: `Ya existe un cupón con el código ${codigo}.` }
    return { ok: false, error: 'No se pudo crear el cupón.' }
  }

  revalidar()
  return { ok: true, cupon: creado }
}

export type TandaCupones = {
  cantidad: number
  pct: number
  prefijo: string
  nota: string
}

// El caso de la búsqueda del tesoro: N cupones de un solo uso, cada uno con
// su propio código, creados de una. Cargarlos a mano de a uno sería inviable
// para una tanda de 30 papelitos.
//
// Devuelve las filas creadas para que el panel las pueda mostrar y bajar en
// CSV en el acto — es el único momento en que los códigos están juntos y en
// orden; después se mezclan con los de tandas anteriores en la lista.
export async function generarTandaCupones(
  datos: TandaCupones,
): Promise<{ ok: true; cupones: Cupon[] } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > MAX_POR_TANDA) {
    return { ok: false, error: `Elegí una cantidad entre 1 y ${MAX_POR_TANDA}.` }
  }
  if (!pctValido(datos.pct)) return { ok: false, error: 'El descuento tiene que ser un número entero entre 1 y 100.' }

  const prefijo = normalizarCodigo(datos.prefijo).replace(/[^A-Z0-9]/g, '')
  if (prefijo.length > 12) return { ok: false, error: 'El prefijo puede tener hasta 12 caracteres.' }

  // Los códigos se sortean al azar: hay que saber cuáles ya existen para no
  // chocar contra el unique de la tabla y que la tanda salga corta.
  const { data: existentes, error: errLeer } = await supabase.from('cupones').select('codigo')
  if (errLeer) return { ok: false, error: 'No se pudo leer la lista de cupones.' }
  const yaUsados = new Set((existentes ?? []).map((c) => normalizarCodigo(c.codigo)))

  const codigos = generarCodigosUnicos(datos.cantidad, prefijo, yaUsados)
  if (codigos.length < datos.cantidad) {
    return { ok: false, error: 'No se pudieron generar códigos distintos suficientes. Probá con otro prefijo.' }
  }

  const nota = datos.nota.trim() || null
  const filas: CuponInsert[] = codigos.map((codigo) => ({
    codigo,
    pct: datos.pct,
    activo: true,
    // Un uso y listo: es la regla de la búsqueda del tesoro.
    usos_maximos: 1,
    // Quien encuentra el papelito en la calle no está suscripto ni tiene por
    // qué estarlo — con esto en true le rebotaría siempre.
    requiere_suscripcion: false,
    una_vez_por_email: false,
    nota,
  }))

  const { data: creados, error } = await supabase.from('cupones').insert(filas).select('*')
  if (error || !creados) return { ok: false, error: 'No se pudieron crear los cupones.' }

  revalidar()
  // El orden que devuelve Postgres no tiene por qué ser el del insert, y la
  // lista impresa se lee mejor ordenada: se reordena según `codigos`.
  const porCodigo = new Map(creados.map((c) => [c.codigo, c]))
  return { ok: true, cupones: codigos.map((c) => porCodigo.get(c)).filter((c): c is Cupon => c != null) }
}

export type CambioCupon = Partial<Pick<Cupon, 'activo' | 'pct' | 'nota'>>

export async function actualizarCupon(id: string, cambio: CambioCupon): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  if (cambio.pct !== undefined && !pctValido(cambio.pct)) {
    return { ok: false, error: 'El descuento tiene que ser un número entero entre 1 y 100.' }
  }

  const { error } = await supabase.from('cupones').update(cambio).eq('id', id)
  if (error) return { ok: false, error: 'No se pudo guardar el cambio.' }

  revalidar()
  return { ok: true }
}

export async function borrarCupon(id: string): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  // El de bienvenida es el que /api/newsletter manda por mail a cada persona
  // que se suscribe: si desaparece, el popup del sitio queda prometiendo un
  // cupón que no existe y nadie se entera hasta que alguien reclama.
  // Apagarlo (activo = false) hace lo mismo sin romper nada.
  const { data: cupon } = await supabase.from('cupones').select('es_bienvenida').eq('id', id).maybeSingle()
  if (cupon?.es_bienvenida) {
    return {
      ok: false,
      error: 'Ese es el cupón que se manda por mail al suscribirse. Apagalo si no querés que se use, pero no lo borres.',
    }
  }

  const { error } = await supabase.from('cupones').delete().eq('id', id)
  if (error) return { ok: false, error: 'No se pudo borrar el cupón.' }

  revalidar()
  return { ok: true }
}

// Borrado en lote de los que ya no sirven (agotados/usados de tandas
// viejas). Después de un par de búsquedas del tesoro la lista se llena de
// códigos muertos y encontrar los vivos se vuelve incómodo.
export async function borrarCupones(ids: string[]): Promise<{ ok: true; borrados: number } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (ids.length === 0) return { ok: true, borrados: 0 }

  const { data: protegidos } = await supabase
    .from('cupones')
    .select('id')
    .in('id', ids)
    .eq('es_bienvenida', true)
  const idsProtegidos = new Set((protegidos ?? []).map((c) => c.id))
  const aBorrar = ids.filter((id) => !idsProtegidos.has(id))
  if (aBorrar.length === 0) return { ok: false, error: 'No hay cupones para borrar en esa selección.' }

  const { error } = await supabase.from('cupones').delete().in('id', aBorrar)
  if (error) return { ok: false, error: 'No se pudieron borrar los cupones.' }

  revalidar()
  return { ok: true, borrados: aBorrar.length }
}
