import 'server-only'
import { storeConfig } from '@/lib/store-config'
import { formatARS } from '@/lib/format'
import { construirMensajePedido, type DatosPedidoMensaje } from '@/lib/whatsapp'
import {
  SITE_URL,
  METODO_PAGO_LABEL,
  ESTADO_PEDIDO_PUBLICO,
  andreaniSeguimientoUrl,
} from '@/lib/constants'
import type { CuentaPago } from '@/lib/configuracion'
import type { EstadoPedido, MetodoPago } from '@/types/db'

type EnvioResultado = { sent: boolean; reason?: string }

// Envía un email genérico usando el proveedor configurado (Resend o SMTP).
// Nunca lanza: si algo falla, devuelve { sent: false } para no frenar el
// pedido/la suscripción. `to` por defecto es Dani (OWNER_EMAIL, los avisos
// de pedido nuevo); enviarCuponBienvenida() lo pisa con el email del cliente.
async function enviarEmail(opts: {
  subject: string
  html: string
  text: string
  to?: string
  from?: string
}): Promise<EnvioResultado> {
  const to = opts.to || process.env.OWNER_EMAIL
  const from = opts.from || process.env.EMAIL_FROM
  if (!to || !from) return { sent: false, reason: 'email no configurado' }

  const provider = (process.env.EMAIL_PROVIDER ?? 'resend').toLowerCase()

  try {
    if (provider === 'smtp') {
      const host = process.env.SMTP_HOST
      if (!host) return { sent: false, reason: 'SMTP_HOST no configurado' }
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? '587'),
        secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
      await transporter.sendMail({ from, to, subject: opts.subject, html: opts.html, text: opts.text })
      return { sent: true }
    }

    // Resend (por defecto)
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY no configurado' }
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({ from, to, subject: opts.subject, html: opts.html, text: opts.text })
    if (error) return { sent: false, reason: error.message }
    return { sent: true }
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'error desconocido' }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// -----------------------------------------------------------------------------
// Piezas compartidas de los mails al CLIENTE
//
// Todo con estilos inline y tablas: los clientes de correo (Gmail, Outlook)
// ignoran <style> en el head y no soportan flex/grid. Nada de imágenes
// remotas tampoco — Gmail las bloquea por defecto y el mail se vería roto.
// -----------------------------------------------------------------------------

const VIOLETA = '#3d3258'
const VIOLETA_CLARO = '#ede8f5'

// El link con el que el cliente vuelve a ver su pedido. El token es lo único
// que autoriza (ver getPedidoPublico en src/lib/pedidos.ts): sin él, el número
// de pedido solo no abre nada.
export function linkSeguimiento(numeroPedido: string, token: string): string {
  return `${SITE_URL}/pedido/${encodeURIComponent(numeroPedido)}?t=${encodeURIComponent(token)}`
}

function envoltorio(titulo: string, cuerpo: string): string {
  return `
  <div style="background:#f6f5f9;padding:24px 12px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e4e0ee">
      <div style="background:${VIOLETA};padding:20px 24px">
        <h1 style="margin:0;color:${VIOLETA_CLARO};font-size:19px;letter-spacing:0.02em">${escapeHtml(titulo)}</h1>
      </div>
      <div style="padding:24px">${cuerpo}</div>
      <div style="padding:16px 24px;border-top:1px solid #eeecf4;color:#8a849c;font-size:12px;line-height:1.6">
        ${escapeHtml(storeConfig.nombre)} · Si tenés cualquier duda, respondé este mail y te contestamos.
      </div>
    </div>
  </div>`
}

function boton(href: string, texto: string): string {
  return `
  <p style="margin:22px 0 0;text-align:center">
    <a href="${href}" style="display:inline-block;background:${VIOLETA};color:${VIOLETA_CLARO};text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold;font-size:14px">
      ${escapeHtml(texto)}
    </a>
  </p>`
}

type ItemMail = { nombre: string; cantidad: number; precio_unitario: number }

function tablaResumen(opts: {
  items: ItemMail[]
  costoEnvio: number | null
  descuento: number
  cuponCodigo: string | null
  total: number
}): string {
  const filas = opts.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:6px 0;color:#4b4560;font-size:14px">${it.cantidad}× ${escapeHtml(it.nombre)}</td>
          <td style="padding:6px 0;text-align:right;color:#4b4560;font-size:14px;white-space:nowrap">${formatARS(
            it.precio_unitario * it.cantidad,
          )}</td>
        </tr>`,
    )
    .join('')

  const extras: string[] = []
  if (opts.descuento > 0) {
    const detalle = opts.cuponCodigo ? ` (cupón ${escapeHtml(opts.cuponCodigo)})` : ''
    extras.push(
      `<tr><td style="padding:6px 0;color:#4b4560;font-size:14px">Descuento${detalle}</td><td style="padding:6px 0;text-align:right;color:#2f9e63;font-size:14px;white-space:nowrap">−${formatARS(
        opts.descuento,
      )}</td></tr>`,
    )
  }
  extras.push(
    `<tr><td style="padding:6px 0;color:#4b4560;font-size:14px">Envío</td><td style="padding:6px 0;text-align:right;color:#4b4560;font-size:14px;white-space:nowrap">${
      opts.costoEnvio == null
        ? 'a coordinar'
        : opts.costoEnvio === 0
          ? 'Gratis'
          : formatARS(opts.costoEnvio)
    }</td></tr>`,
  )

  return `
  <table style="width:100%;border-collapse:collapse;margin:4px 0 0">
    ${filas}
    <tr><td colspan="2" style="padding:6px 0"><div style="height:1px;background:#eeecf4"></div></td></tr>
    ${extras.join('')}
    <tr>
      <td style="padding:10px 0 0;font-weight:bold;color:${VIOLETA};font-size:16px">Total</td>
      <td style="padding:10px 0 0;text-align:right;font-weight:bold;color:${VIOLETA};font-size:16px;white-space:nowrap">${formatARS(
        opts.total,
      )}</td>
    </tr>
  </table>`
}

function bloqueCuentas(cuentas: CuentaPago[]): string {
  if (cuentas.length === 0) return ''
  const items = cuentas
    .map((c) => {
      const lineas = [
        c.titular && `Titular: ${escapeHtml(c.titular)}`,
        c.cbu && `CBU: ${escapeHtml(c.cbu)}`,
        c.alias && `Alias: ${escapeHtml(c.alias)}`,
      ].filter(Boolean)
      const nombre = c.etiqueta || c.banco || 'Cuenta'
      return `
      <div style="margin:0 0 10px;padding:12px 14px;background:#faf9fc;border:1px solid #eeecf4;border-radius:10px">
        <p style="margin:0 0 4px;font-weight:bold;color:${VIOLETA};font-size:14px">${escapeHtml(nombre)}</p>
        <p style="margin:0;color:#4b4560;font-size:13px;line-height:1.7">${lineas.join('<br>')}</p>
      </div>`
    })
    .join('')

  return `
  <h2 style="margin:24px 0 10px;font-size:15px;color:${VIOLETA}">Para completar el pago</h2>
  <p style="margin:0 0 12px;color:#6b6480;font-size:14px;line-height:1.6">
    Transferí a la cuenta que más te convenga y mandanos el comprobante por WhatsApp.
    Usá tu número de pedido como referencia.
  </p>
  ${items}`
}

function textoResumen(items: ItemMail[], total: number): string {
  return `${items.map((i) => `- ${i.cantidad}x ${i.nombre}`).join('\n')}\n\nTotal: ${formatARS(total)}`
}

// Notifica a Daniela un pedido nuevo. Incluye el link de WhatsApp como respaldo
// (por si el email no llega, o no está configurado).
export async function notificarPedidoNuevo(
  datos: DatosPedidoMensaje,
  whatsappUrl: string,
): Promise<EnvioResultado> {
  const subject = `Nuevo pedido ${datos.numeroPedido} — ${formatARS(datos.total)}`

  const itemsHtml = datos.items
    .map(
      (it) =>
        `<tr><td style="padding:4px 8px">${it.cantidad}×</td><td style="padding:4px 8px">${escapeHtml(
          it.nombre,
        )}</td><td style="padding:4px 8px;text-align:right">${formatARS(
          it.precio_unitario * it.cantidad,
        )}</td></tr>`,
    )
    .join('')

  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto">
    <h2 style="margin:0 0 4px">Nuevo pedido ${datos.numeroPedido}</h2>
    <p style="margin:0 0 12px;color:#555">Cliente: ${escapeHtml(datos.clienteNombre)}${
      datos.clienteTelefono ? ` · ${escapeHtml(datos.clienteTelefono)}` : ''
    }</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml}</table>
    <p style="margin:12px 0 0;font-size:16px"><strong>Total: ${formatARS(datos.total)}</strong></p>
    <p style="margin:16px 0">
      <a href="${whatsappUrl}" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">
        Responder por WhatsApp
      </a>
    </p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:13px">${escapeHtml(
      construirMensajePedido(datos),
    )}</pre>
  </div>`

  const text = `${construirMensajePedido(datos)}\n\nWhatsApp: ${whatsappUrl}`

  return enviarEmail({ subject, html, text, from: process.env.EMAIL_FROM_PEDIDOS || process.env.EMAIL_FROM })
}

// Cupón de bienvenida (Fase 8e): se manda apenas alguien completa el popup
// de suscripción — un único código general, sin verificación de email antes
// (ver getCuponBienvenida en src/lib/configuracion.ts).
export async function enviarCuponBienvenida(opts: {
  destinatario: string
  nombre: string
  codigo: string
  pct: number
}): Promise<EnvioResultado> {
  const nombreTienda = storeConfig.nombre
  const subject = `¡Gracias por suscribirte a ${nombreTienda}! Acá tenés tu cupón`

  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto">
    <h2 style="margin:0 0 12px">¡Hola${opts.nombre ? ` ${escapeHtml(opts.nombre)}` : ''}!</h2>
    <p style="margin:0 0 16px;color:#555">
      Gracias por sumarte a ${escapeHtml(nombreTienda)}. Este es tu cupón para tu primera compra:
    </p>
    <p style="margin:0 0 16px;text-align:center">
      <span style="display:inline-block;background:#3d3258;color:#ede8f5;font-size:20px;font-weight:bold;letter-spacing:2px;padding:12px 24px;border-radius:8px">
        ${escapeHtml(opts.codigo)}
      </span>
    </p>
    <p style="margin:0;color:#555">
      Ingresalo en el checkout para llevarte ${opts.pct}% OFF. ¡Te esperamos!
    </p>
  </div>`

  const text = `¡Hola${opts.nombre ? ` ${opts.nombre}` : ''}!\n\nGracias por sumarte a ${nombreTienda}. Tu cupón: ${opts.codigo}\nIngresalo en el checkout para llevarte ${opts.pct}% OFF.`

  return enviarEmail({
    subject,
    html,
    text,
    to: opts.destinatario,
    from: process.env.EMAIL_FROM_PROMOCIONES || process.env.EMAIL_FROM,
  })
}

function primerNombre(nombre: string): string {
  return (nombre ?? '').trim().split(/\s+/)[0] ?? ''
}

// Armar el mail y mandarlo son dos cosas separadas a propósito: así el
// contenido (que es lo que ve un cliente real y no se puede corregir una vez
// enviado) se puede testear sin tocar ningún proveedor.
type MailArmado = { subject: string; html: string; text: string }

export type DatosConfirmacion = {
  numeroPedido: string
  token: string
  clienteNombre: string
  clienteEmail: string
  items: ItemMail[]
  costoEnvio: number | null
  descuento: number
  cuponCodigo: string | null
  total: number
  metodoPago: MetodoPago
  direccionEnvio: string
  zonaEnvio: string | null
  cuentas: CuentaPago[]
}

// Confirmación al CLIENTE apenas hace el pedido. Hasta la Fase 9 quien
// compraba no recibía absolutamente nada: si cerraba la pestaña de la
// confirmación, se quedaba sin número de pedido y sin los datos para
// transferir. Este mail es el respaldo que faltaba, y el único lugar donde
// viaja el link con token para volver a ver el pedido cuando quiera.
export function construirConfirmacionPedido(opts: DatosConfirmacion): MailArmado {
  const subject = `Recibimos tu pedido ${opts.numeroPedido} 🌙`
  const url = linkSeguimiento(opts.numeroPedido, opts.token)
  const nombre = primerNombre(opts.clienteNombre)
  // Las cuentas solo tienen sentido si todavía hay algo que transferir. Con
  // Mercado Pago el pago ya se resolvió en la pasarela.
  const pagaTransfiriendo = opts.metodoPago === 'transferencia' || opts.metodoPago === 'deposito'

  const cuerpo = `
    <p style="margin:0 0 14px;color:#4b4560;font-size:15px;line-height:1.6">
      ¡Hola${nombre ? ` ${escapeHtml(nombre)}` : ''}! Tu pedido
      <strong style="color:${VIOLETA}">${escapeHtml(opts.numeroPedido)}</strong> quedó registrado.
      ${
        pagaTransfiriendo
          ? 'Apenas nos llegue el comprobante lo preparamos y sale para tu casa.'
          : 'Ya lo estamos preparando — te avisamos por acá en cuanto lo despachemos.'
      }
    </p>

    <h2 style="margin:22px 0 6px;font-size:15px;color:${VIOLETA}">Tu pedido</h2>
    ${tablaResumen({
      items: opts.items,
      costoEnvio: opts.costoEnvio,
      descuento: opts.descuento,
      cuponCodigo: opts.cuponCodigo,
      total: opts.total,
    })}

    <h2 style="margin:24px 0 6px;font-size:15px;color:${VIOLETA}">Entrega y pago</h2>
    <p style="margin:0;color:#4b4560;font-size:14px;line-height:1.7">
      ${escapeHtml(opts.direccionEnvio)}${
        opts.zonaEnvio ? `<br><span style="color:#8a849c">${escapeHtml(opts.zonaEnvio)}</span>` : ''
      }<br>
      ${escapeHtml(METODO_PAGO_LABEL[opts.metodoPago])}
    </p>

    ${pagaTransfiriendo ? bloqueCuentas(opts.cuentas) : ''}

    ${boton(url, 'Seguir mi pedido')}
    <p style="margin:12px 0 0;text-align:center;color:#8a849c;font-size:12px">
      Guardá este mail: desde ese botón podés ver el estado de tu pedido cuando quieras.
    </p>`

  const text = [
    `¡Hola${nombre ? ` ${nombre}` : ''}! Tu pedido ${opts.numeroPedido} quedó registrado.`,
    '',
    textoResumen(opts.items, opts.total),
    '',
    `Entrega: ${opts.direccionEnvio}`,
    `Pago: ${METODO_PAGO_LABEL[opts.metodoPago]}`,
    '',
    `Seguí tu pedido: ${url}`,
  ].join('\n')

  return { subject, html: envoltorio('¡Gracias por tu compra!', cuerpo), text }
}

export async function enviarConfirmacionPedido(opts: DatosConfirmacion): Promise<EnvioResultado> {
  return enviarEmail({
    ...construirConfirmacionPedido(opts),
    to: opts.clienteEmail,
    from: process.env.EMAIL_FROM_PEDIDOS || process.env.EMAIL_FROM,
  })
}

export type DatosCambioEstado = {
  numeroPedido: string
  token: string
  clienteNombre: string
  clienteEmail: string
  estado: EstadoPedido
  seguimiento: string | null
  total: number
}

// Aviso al CLIENTE cuando Dani mueve el pedido de estado. No se manda para
// 'pendiente' (ese momento ya lo cubre la confirmación de arriba) — de eso se
// encarga quien llama, ver cambiarEstadoPedido().
export function construirCambioEstado(opts: DatosCambioEstado): MailArmado {
  const vista = ESTADO_PEDIDO_PUBLICO[opts.estado]
  const subject = `Pedido ${opts.numeroPedido}: ${vista.titulo.toLowerCase()}`
  const url = linkSeguimiento(opts.numeroPedido, opts.token)
  const nombre = primerNombre(opts.clienteNombre)

  const bloqueSeguimiento =
    opts.estado === 'enviado' && opts.seguimiento
      ? `
      <div style="margin:20px 0 0;padding:14px 16px;background:#faf9fc;border:1px solid #eeecf4;border-radius:10px">
        <p style="margin:0 0 4px;color:#8a849c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em">Seguimiento Andreani</p>
        <p style="margin:0 0 8px;color:${VIOLETA};font-size:16px;font-weight:bold;letter-spacing:0.04em">${escapeHtml(
          opts.seguimiento,
        )}</p>
        <a href="${andreaniSeguimientoUrl(opts.seguimiento)}" style="color:${VIOLETA};font-size:13px">
          Rastrear en andreani.com →
        </a>
      </div>`
      : ''

  const cuerpo = `
    <p style="margin:0 0 14px;color:#4b4560;font-size:15px;line-height:1.6">
      ¡Hola${nombre ? ` ${escapeHtml(nombre)}` : ''}! Novedades de tu pedido
      <strong style="color:${VIOLETA}">${escapeHtml(opts.numeroPedido)}</strong>.
    </p>
    <p style="margin:0;color:#4b4560;font-size:15px;line-height:1.6">${escapeHtml(vista.detalle)}</p>
    ${bloqueSeguimiento}
    ${boton(url, 'Ver mi pedido')}`

  const text = [
    `¡Hola${nombre ? ` ${nombre}` : ''}! Tu pedido ${opts.numeroPedido}: ${vista.titulo}.`,
    '',
    vista.detalle,
    opts.estado === 'enviado' && opts.seguimiento
      ? `\nSeguimiento Andreani: ${opts.seguimiento}\n${andreaniSeguimientoUrl(opts.seguimiento)}`
      : '',
    '',
    `Ver tu pedido: ${url}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject, html: envoltorio(vista.titulo, cuerpo), text }
}

export async function enviarCambioEstado(opts: DatosCambioEstado): Promise<EnvioResultado> {
  return enviarEmail({
    ...construirCambioEstado(opts),
    to: opts.clienteEmail,
    from: process.env.EMAIL_FROM_PEDIDOS || process.env.EMAIL_FROM,
  })
}

// Aviso a Daniela de que Mercado Pago acreditó la plata. Reemplaza al aviso
// por WhatsApp vía CallMeBot, que se dio de baja (nunca llegó a configurarse
// en producción, así que en los hechos este es el primer aviso real de pago
// acreditado que va a recibir).
export async function notificarPagoAcreditado(opts: {
  numeroPedido: string
  clienteNombre: string
  total: number
}): Promise<EnvioResultado> {
  const subject = `💰 Pago acreditado ${opts.numeroPedido} — ${formatARS(opts.total)}`
  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto">
    <h2 style="margin:0 0 4px">Mercado Pago acreditó el pago</h2>
    <p style="margin:0;color:#555">
      Pedido <strong>${escapeHtml(opts.numeroPedido)}</strong> — ${escapeHtml(opts.clienteNombre)}<br>
      Total: <strong>${formatARS(opts.total)}</strong>
    </p>
    <p style="margin:16px 0 0;color:#555">
      El pedido ya quedó como <strong>pagado</strong> y el stock se descontó solo.
      Cuando lo despaches, marcalo como enviado desde el panel para que se le avise al cliente.
    </p>
  </div>`
  const text = `Pago acreditado — pedido ${opts.numeroPedido} (${opts.clienteNombre}), total ${formatARS(
    opts.total,
  )}. Ya quedó como pagado y el stock se descontó.`

  return enviarEmail({
    subject,
    html,
    text,
    from: process.env.EMAIL_FROM_PEDIDOS || process.env.EMAIL_FROM,
  })
}
