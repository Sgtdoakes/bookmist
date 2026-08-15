// Formateo de moneda en español rioplatense.

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

// Precio en pesos argentinos, sin centavos (ej: $18.900).
export function formatARS(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0
  return ARS.format(Number.isFinite(n) ? (n as number) : 0)
}

// Los textos largos que Dani escribe en el admin (la descripción de un
// producto) son texto plano, y HTML colapsa cualquier salto de línea a un
// espacio: sin esto, una descripción escrita en tres párrafos se publica
// como un bloque corrido.
//
// Una o más líneas en blanco separan párrafos. Un salto simple NO abre
// párrafo nuevo — queda adentro del mismo, y lo respeta el CSS
// (whitespace-pre-line) de quien renderiza.
export function separarEnParrafos(texto: string | null | undefined): string[] {
  if (!texto) return []
  return texto
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

// Mismo texto aplastado a una sola línea, para donde los saltos no son
// contenido sino ruido: meta description, Open Graph, JSON-LD.
export function enUnaLinea(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim()
}
