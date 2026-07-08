import { NextResponse } from 'next/server'
import { qrTransferenciaSchema } from '@/lib/validations'
import { getCuentasPago, cuentaConQr, getMarcaConfig } from '@/lib/configuracion'
import { generarImagenQrTransferencia } from '@/lib/qr-transferencia-ar'

// Genera el QR real (BCRA "Transferencias 3.0") con el monto exacto del
// pedido — separado del checkout porque el total del carrito solo se
// conoce en el cliente (useCart es client-side), mientras que el CUIT y el
// resto de los datos de la cuenta viven server-side.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 })
  }

  const parsed = qrTransferenciaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos.' }, { status: 400 })
  }
  const { cuentaId, monto, referencia } = parsed.data

  const cuentas = await getCuentasPago()
  const cuenta = cuentas.find((c) => c.id === cuentaId)
  if (!cuenta || !cuentaConQr(cuenta)) {
    return NextResponse.json({ ok: false, error: 'Esa cuenta no tiene QR disponible.' }, { status: 404 })
  }

  const marca = await getMarcaConfig()

  try {
    const dataUrl = await generarImagenQrTransferencia({
      cuit: cuenta.cuit,
      aliasOCbu: cuenta.alias || cuenta.cbu,
      nombre: cuenta.titular || marca.nombre,
      ciudad: 'ARGENTINA',
      montoArs: monto,
      referencia: referencia ?? undefined,
    })
    return NextResponse.json({ ok: true, dataUrl })
  } catch {
    return NextResponse.json({ ok: false, error: 'No pudimos generar el QR.' }, { status: 500 })
  }
}
