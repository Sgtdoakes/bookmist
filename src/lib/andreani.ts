import 'server-only'

// Cotización de envíos en tiempo real contra la API PyME de Andreani (la
// misma que usa su plugin oficial de WooCommerce — no hay docs públicas,
// el contrato de esta API sale de leer ese plugin). Flujo:
//   1. POST /Login con el Credential ID (generado en pymes.andreani.com/
//      integraciones) -> accessToken + contratos de la cuenta.
//   2. POST /Pyme/rates con origen/destino/bultos -> tarifas por modo de
//      entrega ("estándar" = domicilio, "sucursal" = retiro, etc.).
//
// Degrada con elegancia: sin credencial configurada o con la API caída,
// devuelve null y el checkout cae a las zonas de envío manuales.

const BASE = 'https://woocommerce-api-acom.andreani.com'

export function andreaniConfigured() {
  return !!process.env.ANDREANI_CREDENTIAL_ID && !!process.env.ANDREANI_CP_ORIGEN
}

// El token vive en el scope del módulo: se reusa entre requests calientes
// de la misma instancia serverless y se renueva solo. El TTL real no está
// documentado — 20 minutos + reintento ante 401 cubre ambos casos.
let tokenCache: { token: string; expira: number } | null = null

async function login(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/v1/Login`, {
      method: 'POST',
      headers: {
        Authorization: process.env.ANDREANI_CREDENTIAL_ID as string,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error('[andreani] login falló con HTTP', res.status)
      return null
    }
    const json = (await res.json()) as { response?: { accessToken?: string } }
    return json.response?.accessToken ?? null
  } catch (e) {
    console.error('[andreani] login inaccesible', e)
    return null
  }
}

async function getToken(forzar = false): Promise<string | null> {
  if (!forzar && tokenCache && Date.now() < tokenCache.expira) return tokenCache.token
  const token = await login()
  if (token) tokenCache = { token, expira: Date.now() + 20 * 60 * 1000 }
  return token
}

// CP argentino: acepta "1425", "C1425DKE", "b1676" -> se queda con los 4 dígitos.
export function normalizarCP(cp: string): string | null {
  const m = cp.trim().toUpperCase().match(/\d{4}/)
  return m ? m[0] : null
}

export type BultoCotizacion = {
  cantidad: number
  precio: number
  peso_gramos: number
  alto_cm: number
  ancho_cm: number
  largo_cm: number
}

type RatesResponse = {
  response?: { rates?: { code?: string; total?: number }[] }
}

// Cotiza el envío a domicilio (modo "estándar") al CP destino. Devuelve el
// costo redondeado a peso entero, o null si no se pudo cotizar.
export async function cotizarEnvioDomicilio(
  cpDestino: string,
  bultos: BultoCotizacion[],
): Promise<number | null> {
  if (!andreaniConfigured() || bultos.length === 0) return null
  const cp = normalizarCP(cpDestino)
  if (!cp) return null

  const body = JSON.stringify({
    postal_code_origin: process.env.ANDREANI_CP_ORIGEN,
    postal_code_destination: cp,
    products: bultos.map((b) => ({
      quantity: b.cantidad,
      price: Math.round(b.precio),
      dimensions: {
        width: Math.max(1, Math.round(b.ancho_cm)),
        height: Math.max(1, Math.round(b.alto_cm)),
        depth: Math.max(1, Math.round(b.largo_cm)),
        grams: Math.max(1, Math.round(b.peso_gramos)),
      },
    })),
  })

  async function pedir(token: string) {
    return fetch(`${BASE}/api/v1/Pyme/rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  }

  try {
    let token = await getToken()
    if (!token) return null
    let res = await pedir(token)
    if (res.status === 401) {
      // Token vencido: renovar y reintentar una vez.
      token = await getToken(true)
      if (!token) return null
      res = await pedir(token)
    }
    if (!res.ok) {
      console.error('[andreani] cotización falló con HTTP', res.status)
      return null
    }
    const json = (await res.json()) as RatesResponse
    const domicilio = json.response?.rates?.find((r) => r.code === 'estándar')
    if (!domicilio || typeof domicilio.total !== 'number' || domicilio.total <= 0) return null
    return Math.round(domicilio.total)
  } catch (e) {
    console.error('[andreani] cotización inaccesible', e)
    return null
  }
}
