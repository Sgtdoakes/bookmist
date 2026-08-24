// Parte pura del cintillo (la franja de arriba de todo). Vive separado de
// src/lib/configuracion.ts —que consulta la base— para que el formulario del
// panel, que es un componente cliente, pueda mostrar la previsualización
// exacta sin arrastrar el cliente de Supabase al navegador. Mismo criterio
// que cupon.ts / cupon-codigo.ts.

// El cintillo nació anunciando el % por transferencia y nada más; ahora son
// tres cosas separadas porque anunciar y descontar son decisiones distintas:
// se puede sacar el cartel sin tocar el descuento, o dejarlo andando sin
// gritarlo en la home.
export type CintilloConfig = {
  visible: boolean
  // Vacío = el texto automático del % por transferencia, así el cartel nunca
  // puede prometer un número distinto al que cobra el checkout.
  texto: string
  descuentoPct: number
}

// Qué termina diciendo la franja, o '' si no dice nada (y entonces no se
// dibuja, ni siquiera el fondo).
export function textoCintillo(cfg: CintilloConfig): string {
  if (!cfg.visible) return ''
  if (cfg.texto.trim()) return cfg.texto.trim()
  return cfg.descuentoPct > 0 ? `✨ ${cfg.descuentoPct}% de descuento con transferencia ✨` : ''
}
