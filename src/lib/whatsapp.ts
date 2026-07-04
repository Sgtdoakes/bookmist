// Arma un link de WhatsApp (wa.me) con un mensaje prearmado.
// numero: en formato internacional, solo dígitos (ej: 5491122334455).
export function whatsappLink(numero: string, mensaje: string): string {
  const phone = (numero ?? '').replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`
}
