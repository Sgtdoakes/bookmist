'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getDestacados } from '@/lib/productos'
import { resolverProductosBloque } from '@/components/public/productos-bloque'
import {
  filasAAdmin,
  resolverSeccion,
  TIPOS_CONOCIDOS,
  type SeccionAdmin,
  type SeccionPreview,
  type SeccionTipo,
} from '@/lib/secciones'

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
  revalidatePath('/admin/pagina')
}

function esSeccionTipoConocido(tipo: string): tipo is SeccionTipo {
  return (TIPOS_CONOCIDOS as string[]).includes(tipo)
}

export async function getSeccionesAdmin(pagina = 'home'): Promise<SeccionAdmin[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('pagina_secciones')
    .select('*')
    .eq('pagina', pagina)
    .order('orden', { ascending: true })
  if (error) return []
  return filasAAdmin(data ?? [])
}

// Resuelve un lote de bloques (borrador, todavía no guardado) a datos
// pintables — para 'productos'/'mas_vendidos' trae los productos reales
// según la fuente configurada; el resto de los tipos son puros y se
// devuelven tal cual. Lo llama el lienzo del admin al agregar un bloque o
// al cambiar algo que afecta QUÉ se muestra (fuente/categoría/selección
// manual), con debounce del lado del cliente.
export async function previewSecciones(
  items: { id: string; tipo: string; config: Record<string, unknown> }[],
): Promise<SeccionPreview[]> {
  const supabase = await clienteAutenticado()
  if (!supabase) return []

  const resultados: SeccionPreview[] = []
  for (const item of items) {
    if (!esSeccionTipoConocido(item.tipo)) continue
    // resolverSeccion() pone id=tipo (pensado solo como key para .map() en
    // el sitio público) — acá hace falta el id REAL de la fila para poder
    // indexar el preview por id en el lienzo del admin.
    const resuelta = { ...resolverSeccion(item.tipo, item.config), id: item.id }
    if (resuelta.tipo === 'productos') {
      const productosResueltos = await resolverProductosBloque(resuelta.config)
      resultados.push({ ...resuelta, productosResueltos })
    } else if (resuelta.tipo === 'mas_vendidos') {
      const productosResueltos = await getDestacados(12)
      resultados.push({ ...resuelta, productosResueltos })
    } else {
      resultados.push(resuelta)
    }
  }
  return resultados
}

export type LayoutItem = {
  id: string // uuid real (existe en la base) o temporal generado al agregar/duplicar (se inserta al guardar)
  tipo: SeccionTipo
  activo: boolean
  config: Record<string, unknown>
}

// Persiste el borrador completo del lienzo de una sola vez: borra lo que se
// sacó, actualiza lo que sigue e inserta lo nuevo, con orden = índice.
// Devuelve las filas frescas (con ids reales) para resetear el editor.
export async function guardarLayout(
  pagina: string,
  items: LayoutItem[],
): Promise<{ ok: true; secciones: SeccionAdmin[] } | Err> {
  const supabase = await clienteAutenticado()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró.' }
  if (items.some((it) => !esSeccionTipoConocido(it.tipo))) {
    return { ok: false, error: 'Tipo de bloque inválido.' }
  }

  const { data: existentes, error: errLeer } = await supabase
    .from('pagina_secciones')
    .select('id')
    .eq('pagina', pagina)
  if (errLeer) return { ok: false, error: 'No se pudo leer el estado actual.' }

  const existIds = new Set((existentes ?? []).map((r) => r.id))
  const draftIds = new Set(items.map((i) => i.id))

  const aBorrar = [...existIds].filter((id) => !draftIds.has(id))
  if (aBorrar.length > 0) {
    const { error } = await supabase.from('pagina_secciones').delete().in('id', aBorrar)
    if (error) return { ok: false, error: 'No se pudieron eliminar bloques.' }
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (existIds.has(it.id)) {
      const { error } = await supabase
        .from('pagina_secciones')
        .update({ tipo: it.tipo, activo: it.activo, config: it.config, orden: i })
        .eq('id', it.id)
      if (error) return { ok: false, error: 'No se pudo guardar un bloque.' }
    } else {
      const { error } = await supabase
        .from('pagina_secciones')
        .insert({ id: it.id, pagina, tipo: it.tipo, activo: it.activo, config: it.config, orden: i })
      if (error) return { ok: false, error: 'No se pudo crear un bloque.' }
    }
  }

  revalidarPublico()
  const { data: frescas } = await supabase
    .from('pagina_secciones')
    .select('*')
    .eq('pagina', pagina)
    .order('orden', { ascending: true })
  return { ok: true, secciones: filasAAdmin(frescas ?? []) }
}
