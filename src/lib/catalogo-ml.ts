import 'server-only'

import { normalizarLibros, type LibroDeML } from '@/lib/catalogo-ml-datos'

// Cliente del catálogo de Martín Libros (martinlibros.com.ar, mismo dueño):
// 450k+ títulos con ISBN, autor, editorial, descripción y tapa, que el panel
// usa para completar los datos de un libro al cargarlo como producto.
//
// Se consume su SERVICIO HTTP, no su base. El contrato de catalogo-ml-datos.ts
// es el que ML promete devolver; si mañana cambian sus tablas, lo arreglan allá
// y acá no se entera nadie. Leerle la tabla `books` directo, además, hubiera
// sido lento: con anon key + RLS la búsqueda con trigramas sobre 450k filas
// tarda 3-4s y timeoutea (medido en ML, documentado en su
// src/lib/supabase/public.ts).
//
// Degrada con elegancia, como el resto de los servicios externos del proyecto:
// sin variables configuradas el buscador se apaga y el alta manual de libros
// sigue funcionando igual. Y deja rastro en los logs cuando falta algo — un
// error mudo acá es exactamente cómo `OWNER_EMAIL` estuvo mes y medio sin
// mandar un solo aviso de pedido.

export type BusquedaEnML =
  | { ok: true; resultados: LibroDeML[] }
  | { ok: false; motivo: 'no_configurado' | 'error' }

// El panel es interactivo: si ML no contesta en 8 segundos, mejor un error
// claro que una rueda girando para siempre.
const TIMEOUT_MS = 8000

export function catalogoMLConfigurado(): boolean {
  return !!process.env.ML_CATALOGO_URL && !!process.env.ML_CATALOGO_TOKEN
}

export async function buscarLibrosEnML(termino: string, limite = 12): Promise<BusquedaEnML> {
  if (!catalogoMLConfigurado()) {
    console.error(
      'Buscador de libros apagado: faltan ML_CATALOGO_URL y/o ML_CATALOGO_TOKEN en el entorno.',
    )
    return { ok: false, motivo: 'no_configurado' }
  }

  const q = termino.trim()
  if (!q) return { ok: true, resultados: [] }

  try {
    const url = new URL('/api/catalogo/buscar', process.env.ML_CATALOGO_URL)
    url.searchParams.set('q', q)
    url.searchParams.set('limite', String(limite))

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.ML_CATALOGO_TOKEN}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      // 401 acá significa que los dos lados tienen tokens distintos — el caso
      // más probable es que uno de los dos no esté cargado en Vercel.
      console.error(`El catálogo de Martín Libros respondió ${res.status} a la búsqueda "${q}".`)
      return { ok: false, motivo: 'error' }
    }

    const data = (await res.json()) as { resultados?: unknown }
    return { ok: true, resultados: normalizarLibros(data?.resultados) }
  } catch (e) {
    console.error('La búsqueda en el catálogo de Martín Libros falló', e)
    return { ok: false, motivo: 'error' }
  }
}
