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

// Campos que comparten alta y edición, con los mismos mensajes de error en
// los dos lados — que un cupón se pueda crear con un valor que después la
// edición rechaza sería desconcertante.
type CamposCupon = {
  codigo: string
  pct: number
  usosMaximos: number | null
  usosMaximosPorEmail: number | null
  requiereSuscripcion: boolean
  nota: string
}

function validarCampos(datos: CamposCupon): { ok: true; codigo: string } | Err {
  const codigo = normalizarCodigo(datos.codigo)
  if (!codigo) return { ok: false, error: 'Escribí un código.' }
  if (!codigoBienFormado(codigo)) {
    return { ok: false, error: 'El código solo puede tener letras, números y guiones (sin espacios ni símbolos).' }
  }
  if (!Number.isInteger(datos.pct) || datos.pct < 1 || datos.pct > 100) {
    return { ok: false, error: 'El descuento tiene que ser un número entero entre 1 y 100.' }
  }
  if (datos.usosMaximos != null && (!Number.isInteger(datos.usosMaximos) || datos.usosMaximos < 1)) {
    return { ok: false, error: 'La cantidad de usos tiene que ser 1 o más.' }
  }
  if (
    datos.usosMaximosPorEmail != null &&
    (!Number.isInteger(datos.usosMaximosPorEmail) || datos.usosMaximosPorEmail < 1)
  ) {
    return { ok: false, error: 'El máximo por persona tiene que ser 1 o más.' }
  }
  // Un máximo por persona más alto que el cupo total no significa nada: el
  // total se agota antes. Se avisa en vez de guardar algo que engaña.
  if (
    datos.usosMaximos != null &&
    datos.usosMaximosPorEmail != null &&
    datos.usosMaximosPorEmail > datos.usosMaximos
  ) {
    return { ok: false, error: 'El máximo por persona no puede ser mayor que la cantidad total de usos.' }
  }
  return { ok: true, codigo }
}

export type NuevoCupon = CamposCupon

export async function crearCupon(datos: NuevoCupon): Promise<{ ok: true; cupon: Cupon } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const v = validarCampos(datos)
  if (!v.ok) return v

  const fila: CuponInsert = {
    codigo: v.codigo,
    pct: datos.pct,
    activo: true,
    usos_maximos: datos.usosMaximos,
    usos_maximos_por_email: datos.usosMaximosPorEmail,
    requiere_suscripcion: datos.requiereSuscripcion,
    nota: datos.nota.trim() || null,
  }
  const { data: creado, error } = await supabase.from('cupones').insert(fila).select('*').single()
  if (error || !creado) {
    // 23505 = unique violation sobre `codigo`.
    if (error?.code === '23505') return { ok: false, error: `Ya existe un cupón con el código ${v.codigo}.` }
    return { ok: false, error: 'No se pudo crear el cupón.' }
  }

  revalidar()
  return { ok: true, cupon: creado }
}

// Edición completa, incluido el código. Renombrar es seguro desde la
// migración 0030: los usos se cuentan por orders.cupon_id, así que la cuenta
// sigue al cupón y no al texto. Antes de eso, renombrar uno usado 18 veces le
// reseteaba el contador y regalaba el cupo entero de nuevo.
export async function editarCupon(id: string, datos: CamposCupon): Promise<{ ok: true; cupon: Cupon } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const v = validarCampos(datos)
  if (!v.ok) return v

  const { data: actualizado, error } = await supabase
    .from('cupones')
    .update({
      codigo: v.codigo,
      pct: datos.pct,
      usos_maximos: datos.usosMaximos,
      usos_maximos_por_email: datos.usosMaximosPorEmail,
      requiere_suscripcion: datos.requiereSuscripcion,
      nota: datos.nota.trim() || null,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !actualizado) {
    if (error?.code === '23505') return { ok: false, error: `Ya existe otro cupón con el código ${v.codigo}.` }
    return { ok: false, error: 'No se pudo guardar el cupón.' }
  }

  revalidar()
  return { ok: true, cupon: actualizado }
}

export type TandaCupones = {
  cantidad: number
  pct: number
  prefijo: string
  nota: string
}

// Códigos ÚNICOS, uno por papel, de un solo uso cada uno. Es lo contrario al
// cupón de código repetido: acá cada papel se puede rastrear individualmente
// y nadie puede usar más de los que tiene en la mano — pero solo sirve si se
// imprime cada código por separado, no una tirada igual de N copias.
//
// Devuelve las filas creadas para que el panel las muestre y las baje en CSV
// en el acto: es el único momento en que están juntas y en orden.
export async function generarTandaCupones(
  datos: TandaCupones,
): Promise<{ ok: true; cupones: Cupon[] } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  if (!Number.isInteger(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > MAX_POR_TANDA) {
    return { ok: false, error: `Elegí una cantidad entre 1 y ${MAX_POR_TANDA}.` }
  }
  if (!Number.isInteger(datos.pct) || datos.pct < 1 || datos.pct > 100) {
    return { ok: false, error: 'El descuento tiene que ser un número entero entre 1 y 100.' }
  }

  const prefijo = normalizarCodigo(datos.prefijo).replace(/[^A-Z0-9]/g, '')
  if (prefijo.length > 12) return { ok: false, error: 'El prefijo puede tener hasta 12 caracteres.' }

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
    usos_maximos: 1,
    usos_maximos_por_email: null,
    // Quien encuentra el papelito en la calle no está suscripto ni tiene por
    // qué estarlo — con esto en true le rebotaría siempre.
    requiere_suscripcion: false,
    nota,
  }))

  const { data: creados, error } = await supabase.from('cupones').insert(filas).select('*')
  if (error || !creados) return { ok: false, error: 'No se pudieron crear los cupones.' }

  revalidar()
  const porCodigo = new Map(creados.map((c) => [c.codigo, c]))
  return { ok: true, cupones: codigos.map((c) => porCodigo.get(c)).filter((c): c is Cupon => c != null) }
}

export async function toggleActivoCupon(id: string, activo: boolean): Promise<Ok | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }

  const { error } = await supabase.from('cupones').update({ activo }).eq('id', id)
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

// Borrado en lote de los que ya no sirven. Después de un par de tandas la
// lista se llena de códigos muertos y encontrar los vivos se vuelve incómodo.
export async function borrarCupones(ids: string[]): Promise<{ ok: true; borrados: number } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (ids.length === 0) return { ok: true, borrados: 0 }

  const { data: protegidos } = await supabase.from('cupones').select('id').in('id', ids).eq('es_bienvenida', true)
  const idsProtegidos = new Set((protegidos ?? []).map((c) => c.id))
  const aBorrar = ids.filter((id) => !idsProtegidos.has(id))
  if (aBorrar.length === 0) return { ok: false, error: 'No hay cupones para borrar en esa selección.' }

  const { error } = await supabase.from('cupones').delete().in('id', aBorrar)
  if (error) return { ok: false, error: 'No se pudieron borrar los cupones.' }

  revalidar()
  return { ok: true, borrados: aBorrar.length }
}
