import { formatARS } from '@/lib/format'
import { METODO_PAGO_LABEL } from '@/lib/constants'
import type { MetodoPago } from '@/types/db'

// Arma un link de WhatsApp (wa.me) con un mensaje prearmado.
// numero: en formato internacional, solo dígitos (ej: 5491122334455).
export function whatsappLink(numero: string, mensaje: string): string {
  const phone = (numero ?? '').replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`
}

export type ItemMensaje = {
  nombre: string
  cantidad: number
  precio_unitario: number
}

export type DatosPedidoMensaje = {
  numeroPedido: string
  clienteNombre: string
  clienteTelefono?: string
  items: ItemMensaje[]
  direccionEnvio: string
  zonaEnvio?: string | null
  costoEnvio: number | null
  metodoPago: MetodoPago
  total: number
  notas?: string | null
}

// Construye el texto del pedido para WhatsApp (y para el email a Daniela).
export function construirMensajePedido(d: DatosPedidoMensaje): string {
  const lineas: string[] = []
  lineas.push(`*Pedido ${d.numeroPedido}* — Bookmist`)
  lineas.push('')
  lineas.push(`Cliente: ${d.clienteNombre}`)
  if (d.clienteTelefono) lineas.push(`Teléfono: ${d.clienteTelefono}`)
  lineas.push('')
  lineas.push('*Cajas/kits:*')
  for (const it of d.items) {
    lineas.push(`• ${it.cantidad}x ${it.nombre} — ${formatARS(it.precio_unitario * it.cantidad)}`)
  }
  lineas.push('')
  lineas.push(`Envío a: ${d.direccionEnvio}`)
  if (d.zonaEnvio) lineas.push(`Zona: ${d.zonaEnvio}`)
  lineas.push(`Costo de envío: ${d.costoEnvio != null ? formatARS(d.costoEnvio) : 'a coordinar'}`)
  lineas.push(`Pago: ${METODO_PAGO_LABEL[d.metodoPago]}`)
  lineas.push(`*Total: ${formatARS(d.total)}*`)
  if (d.notas) {
    lineas.push('')
    lineas.push(`Notas: ${d.notas}`)
  }
  return lineas.join('\n')
}
