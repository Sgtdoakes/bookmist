import 'server-only'
import { storeConfig } from '@/lib/store-config'
import { formatARS } from '@/lib/format'
import { construirMensajePedido, type DatosPedidoMensaje } from '@/lib/whatsapp'

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
}): Promise<EnvioResultado> {
  const to = opts.to || process.env.OWNER_EMAIL
  const from = process.env.EMAIL_FROM
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

  return enviarEmail({ subject, html, text })
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

  return enviarEmail({ subject, html, text, to: opts.destinatario })
}
