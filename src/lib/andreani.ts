import 'server-only'

// Cotización de envíos en tiempo real contra la API PyME de Andreani (la
// misma que usa su plugin oficial de WooCommerce). Endpoints que usamos, del
// swagger público en https://woocommerce-api-acom.andreani.com/swagger/v1/swagger.json:
//   1. POST /Login con el Credential ID (generado en pymes.andreani.com/
//      integraciones) -> accessToken + contratos de la cuenta.
//   2. POST /Pyme/rates con origen/destino/bultos -> una tarifa por modo de
//      entrega: code "estándar" = a domicilio, y una entrada code "sucursal"
//      POR CADA punto de retiro elegible, cada una con su `reference` (el
//      código de la sucursal, ej. "SAB" o "HOP1182").
//   3. GET /Branch?postalCode=NNNN -> nombre y dirección de esas sucursales
//      (los `reference` de rates matchean el `Codigo` de acá). Sin este
//      cruce el cliente vería códigos sueltos en vez de direcciones.
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
      // Sin body, el endpoint devuelve 404 en vez de autenticar (probado en
      // vivo) — hace falta mandar aunque sea un objeto vacío.
      body: '{}',
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

// Pide a la API con el token cacheado y, si contesta 401, renueva y
// reintenta una sola vez. Devuelve null si no se pudo autenticar.
async function pedirAutenticado(ruta: string, init: RequestInit): Promise<Response | null> {
  const armar = (token: string): RequestInit => ({
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers, 'X-Auth-Token': token },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  let token = await getToken()
  if (!token) return null
  let res = await fetch(`${BASE}${ruta}`, armar(token))
  if (res.status === 401) {
    token = await getToken(true)
    if (!token) return null
    res = await fetch(`${BASE}${ruta}`, armar(token))
  }
  return res
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

// Una sucursal/punto Andreani donde el cliente puede retirar, ya con su
// precio de envío resuelto.
export type OpcionSucursal = {
  codigo: string
  nombre: string
  direccion: string
  costo: number
}

export type CotizacionEnvio = {
  // Costo del envío a domicilio, o null si Andreani no lo ofrece a ese CP.
  domicilio: number | null
  // Puntos de retiro elegibles. Vacío si el contrato no tiene sucursal
  // habilitada o si no hay ninguno cerca de ese CP.
  sucursales: OpcionSucursal[]
}

type RatesResponse = {
  response?: { rates?: { code?: string; total?: number; reference?: string }[] }
}

type DireccionSucursal = {
  Calle?: string
  Numero?: string
  Localidad?: string
  Provincia?: string
  CodigoPostal?: number
}

type BranchResponse = {
  response?: {
    data?: { Codigo?: string; Descripcion?: string; Direccion?: DireccionSucursal }[]
  }
}

// Los códigos de modo vienen con tilde ("estándar"); comparamos sin tildes
// ni mayúsculas para no depender de cómo los escriba la API.
function esModo(code: string | undefined, esperado: string): boolean {
  if (!code) return false
  return (
    code
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase() === esperado
  )
}

function direccionLegible(d: DireccionSucursal | undefined): string {
  if (!d) return ''
  const calle = [d.Calle?.trim(), d.Numero?.trim()].filter(Boolean).join(' ')
  const zona = [d.Localidad?.trim(), d.Provincia?.trim()].filter(Boolean).join(', ')
  const cp = d.CodigoPostal ? `CP ${d.CodigoPostal}` : ''
  return [calle, zona, cp].filter(Boolean).join(', ')
}

// Sucursales y puntos HOP que atienden ese CP. Devuelve [] si no hay ninguna
// (la API contesta 404 con "No branches available") o si algo falla: el
// checkout simplemente no ofrecerá retiro en sucursal.
async function getSucursales(cp: string): Promise<Omit<OpcionSucursal, 'costo'>[]> {
  try {
    const res = await pedirAutenticado(`/api/v1/Branch?postalCode=${cp}`, { method: 'GET' })
    if (!res) return []
    if (!res.ok) {
      // 404 = no hay sucursales para ese CP, no es un error que valga log.
      if (res.status !== 404) console.error('[andreani] sucursales falló con HTTP', res.status)
      return []
    }
    const json = (await res.json()) as BranchResponse
    return (json.response?.data ?? [])
      .filter((s) => s.Codigo)
      .map((s) => ({
        codigo: (s.Codigo as string).toUpperCase(),
        nombre: s.Descripcion?.trim() || (s.Codigo as string),
        direccion: direccionLegible(s.Direccion),
      }))
  } catch (e) {
    console.error('[andreani] sucursales inaccesible', e)
    return []
  }
}

// Cotiza el envío al CP destino: domicilio + cada sucursal elegible.
// Devuelve null si no se pudo cotizar nada (credencial ausente, API caída,
// CP inválido). Un `sucursales: []` con `domicilio` no nulo es normal: ese
// CP no tiene puntos de retiro.
export async function cotizarEnvio(
  cpDestino: string,
  bultos: BultoCotizacion[],
): Promise<CotizacionEnvio | null> {
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

  let rates: NonNullable<NonNullable<RatesResponse['response']>['rates']>
  try {
    const res = await pedirAutenticado('/api/v1/Pyme/rates', { method: 'POST', body })
    if (!res) return null
    if (!res.ok) {
      console.error('[andreani] cotización falló con HTTP', res.status)
      return null
    }
    const json = (await res.json()) as RatesResponse
    rates = json.response?.rates ?? []
  } catch (e) {
    console.error('[andreani] cotización inaccesible', e)
    return null
  }

  const valido = (total: number | undefined): total is number => typeof total === 'number' && total > 0

  const rateDomicilio = rates.find((r) => esModo(r.code, 'estandar'))
  const domicilio = valido(rateDomicilio?.total) ? Math.round(rateDomicilio.total) : null

  const ratesSucursal = rates.filter((r) => esModo(r.code, 'sucursal') && valido(r.total))
  if (ratesSucursal.length === 0) return { domicilio, sucursales: [] }

  // Precio por código de sucursal; el genérico es el respaldo para el caso
  // (no visto en vivo) de que una tarifa venga sin `reference`.
  const costoPorCodigo = new Map<string, number>()
  for (const r of ratesSucursal) {
    if (r.reference) costoPorCodigo.set(r.reference.toUpperCase(), Math.round(r.total as number))
  }
  const costoGenerico = Math.round(Math.min(...ratesSucursal.map((r) => r.total as number)))

  const sucursales = await getSucursales(cp)
  const conTarifaPropia = sucursales
    .filter((s) => costoPorCodigo.has(s.codigo))
    .map((s) => ({ ...s, costo: costoPorCodigo.get(s.codigo) as number }))

  return {
    domicilio,
    // Si ninguna sucursal del directorio matcheó con las tarifas (cambio de
    // formato en la API), igual ofrecemos las del CP al precio genérico —
    // vale más una lista con direcciones que ninguna opción.
    sucursales: conTarifaPropia.length > 0 ? conTarifaPropia : sucursales.map((s) => ({ ...s, costo: costoGenerico })),
  }
}
