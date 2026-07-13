import 'server-only'

// Aviso por WhatsApp al número personal de Dani vía CallMeBot (servicio
// gratuito de notificaciones personales: Dani lo habilita una sola vez
// mandándole "I allow callmebot to send me messages" al bot, y recibe una
// API key). No es la API oficial de WhatsApp Business — para avisos a UN
// número propio es el equilibrio justo entre setup y confiabilidad, y por
// eso el email sigue existiendo como canal paralelo.
//
// Best-effort siempre: un aviso caído nunca frena un pedido ni un webhook.

export function whatsappAvisosConfigured() {
  return !!process.env.CALLMEBOT_PHONE && !!process.env.CALLMEBOT_APIKEY
}

export async function avisarWhatsAppDani(texto: string): Promise<boolean> {
  if (!whatsappAvisosConfigured()) return false
  try {
    const url =
      'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(process.env.CALLMEBOT_PHONE as string)}` +
      `&text=${encodeURIComponent(texto)}` +
      `&apikey=${encodeURIComponent(process.env.CALLMEBOT_APIKEY as string)}`
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8_000) })
    if (!res.ok) console.error('[whatsapp] CallMeBot respondió HTTP', res.status)
    return res.ok
  } catch (e) {
    console.error('[whatsapp] aviso inaccesible', e)
    return false
  }
}
