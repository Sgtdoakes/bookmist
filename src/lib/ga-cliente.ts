// Lee de las cookies de GA4 los dos identificadores que necesita el evento de
// compra que manda el servidor (src/lib/ga-servidor.ts).
//
// Por qué hace falta: cuando el pago lo confirma el webhook de Mercado Pago,
// del otro lado no hay ningún navegador — no hay cookies, no hay sesión, no
// hay de dónde sacar quién es el que compró. Si el evento va sin estos dos
// datos, GA4 lo cuenta como una visita nueva sin origen y la venta aparece
// como "directa", perdiendo que venía de Instagram, de una búsqueda o de un
// anuncio. Así que se capturan en el checkout, que es el único momento en el
// que el navegador y el pedido existen a la vez, y viajan con el pedido.
//
// Todo esto es leer un formato de cookie que Google no documenta como API
// pública: puede cambiar sin aviso. Por eso cada función devuelve null en vez
// de romper, y quien la llama tiene que funcionar igual sin el dato.

function leerCookie(cookieString: string, nombre: string): string | null {
  for (const parte of cookieString.split(';')) {
    const [k, ...resto] = parte.trim().split('=')
    if (k === nombre) return resto.join('=') || null
  }
  return null
}

// Cookie `_ga` = "GA1.<profundidad de dominio>.<mitad 1>.<mitad 2>", y el
// client_id es la unión de las dos mitades: "<mitad 1>.<mitad 2>".
export function clientIdDesdeCookies(cookieString: string): string | null {
  const ga = leerCookie(cookieString, '_ga')
  if (!ga) return null
  const partes = ga.split('.')
  if (partes.length < 4) return null
  const id = `${partes[2]}.${partes[3]}`
  return /^\d+\.\d+$/.test(id) ? id : null
}

// Cookie `_ga_<flujo>` — el flujo sale del measurement id sacándole el "G-".
// Google cambió el formato en el camino y los dos siguen dando vueltas:
//   GS1.1.<session_id>.<nº de sesión>....
//   GS2.1.s<session_id>$o<nº de sesión>$g1$t...   (el actual)
// Se contemplan los dos porque cuál le toca a cada visitante no lo decidimos
// nosotros, lo decide la versión de gtag.js que Google le sirva.
export function sessionIdDesdeCookies(cookieString: string, measurementId: string): string | null {
  const flujo = measurementId.replace(/^G-/, '')
  if (!flujo) return null
  const cookie = leerCookie(cookieString, `_ga_${flujo}`)
  if (!cookie) return null

  const formatoNuevo = cookie.match(/(?:^|\.)s(\d+)\$/)
  if (formatoNuevo) return formatoNuevo[1]

  const partes = cookie.split('.')
  if (partes.length >= 3 && /^\d+$/.test(partes[2])) return partes[2]

  return null
}

export type IdsGA = { clientId: string | null; sessionId: string | null }

// Lo que llama el checkout. `measurementId` puede venir vacío (Analytics
// apagado): ahí no hay nada que leer y el pedido se crea igual.
export function leerIdsGA(cookieString: string, measurementId: string | undefined): IdsGA {
  if (!measurementId) return { clientId: null, sessionId: null }
  return {
    clientId: clientIdDesdeCookies(cookieString),
    sessionId: sessionIdDesdeCookies(cookieString, measurementId),
  }
}
