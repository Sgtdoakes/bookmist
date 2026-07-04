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
