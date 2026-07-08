import QRCode from 'qrcode'

// QR interoperable de transferencias (Argentina) — formato EMV® QR Code
// Specification for Payment Systems (EMV QRCPS) v1.0, con la extensión
// obligatoria del BCRA (Comunicación "A" 6425, 10/01/2018): posición 50 =
// CUIT/CUIL del comercio (obligatorio), posición 51 = Alias/CBU (campo
// reservado obligatorio, dato optativo). Cualquier app bancaria o billetera
// que cumpla el estándar puede leer este QR y transferir directo a la
// cuenta — no requiere ningún contrato ni API con el banco.
//
// Fuente primaria (no un resumen de terceros): PDF oficial del BCRA,
// https://www.bcra.gob.ar/archivos/Pdfs/comytexord/a6425.pdf

function tlv(id: string, value: string): string {
  if (value.length > 99) throw new Error(`Campo QR "${id}" excede el largo máximo (99): ${value}`)
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — el algoritmo de checksum
// que exige el estándar EMVCo QRCPS para el campo final (tag 63). Exportada
// para poder testearla contra el vector de test estándar (input "123456789"
// → "29B1"), independiente de cualquier ejemplo específico de QR.
export function crc16CcittFalse(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export type DatosQrTransferencia = {
  /** CUIT/CUIL del titular, con o sin guiones — obligatorio (BCRA A 6425, posición 50). */
  cuit: string
  /** Alias o CBU/CVU de destino — obligatorio en la práctica (posición 51). */
  aliasOCbu: string
  /** Nombre a mostrar (máx. 25 caracteres por el estándar EMVCo). */
  nombre: string
  /** Ciudad (máx. 15 caracteres por el estándar EMVCo). */
  ciudad: string
  /** Si se indica, genera un QR dinámico con el monto ya cargado. */
  montoArs?: number
  /** Referencia opcional (ej. número de pedido) — va en el campo de datos adicionales. */
  referencia?: string
}

// Arma el payload de texto plano del QR (lo que después se codifica como
// imagen). Separado de la generación de la imagen para poder testearlo sin
// depender de la librería de renderizado.
export function generarPayloadQrTransferencia(datos: DatosQrTransferencia): string {
  const cuitLimpio = datos.cuit.replace(/\D/g, '')
  if (cuitLimpio.length !== 11) {
    throw new Error(`CUIT/CUIL inválido: se esperan 11 dígitos, se recibieron ${cuitLimpio.length}`)
  }
  const dinamico = datos.montoArs != null && datos.montoArs > 0

  const campos: string[] = [
    tlv('00', '01'), // Payload Format Indicator (fijo)
    tlv('01', dinamico ? '12' : '11'), // Point of Initiation Method: 12=dinámico, 11=estático
    tlv('50', cuitLimpio), // CUIT/CUIL — obligatorio (BCRA A 6425)
    tlv('51', datos.aliasOCbu.trim()), // Alias/CBU
    tlv('52', '0000'), // Merchant Category Code (sin clasificar)
    tlv('53', '032'), // Transaction Currency: ARS (ISO 4217 numérico)
  ]
  if (dinamico) {
    campos.push(tlv('54', datos.montoArs!.toFixed(2)))
  }
  campos.push(tlv('58', 'AR')) // Country Code
  campos.push(tlv('59', datos.nombre.trim().slice(0, 25))) // Merchant Name
  campos.push(tlv('60', datos.ciudad.trim().slice(0, 15))) // Merchant City
  if (datos.referencia) {
    // Additional Data Field Template (62) → Reference Label (05), anidado.
    campos.push(tlv('62', tlv('05', datos.referencia.trim().slice(0, 25))))
  }

  const sinCrc = campos.join('') + '6304' // tag+longitud del propio campo CRC, sin valor todavía
  return sinCrc + crc16CcittFalse(sinCrc)
}

// Genera la imagen del QR (data URL PNG) lista para <img src=...>.
export async function generarImagenQrTransferencia(datos: DatosQrTransferencia): Promise<string> {
  const payload = generarPayloadQrTransferencia(datos)
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
}
