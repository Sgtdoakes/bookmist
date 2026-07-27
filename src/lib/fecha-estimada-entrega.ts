// Fecha estimada de entrega para el opt-in de Google Customer Reviews (Fase 8h)
// — Google la exige en formato YYYY-MM-DD. No hay una fecha real: Andreani
// solo cotiza costo, no un ETA. El usuario aceptó una estimación fija
// (aclarando que con Andreani puede variar): domicilio = +5 días hábiles
// (salteando sábados/domingos), retiro en persona = +2 días corridos (no es
// un envío, solo el tiempo para que Dani lo tenga listo).

function sumarDiasHabiles(desde: Date, dias: number): Date {
  const fecha = new Date(desde)
  let restantes = dias
  while (restantes > 0) {
    fecha.setDate(fecha.getDate() + 1)
    const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) restantes--
  }
  return fecha
}

function sumarDiasCorridos(desde: Date, dias: number): Date {
  const fecha = new Date(desde)
  fecha.setDate(fecha.getDate() + dias)
  return fecha
}

// Fecha local (no UTC) para evitar que toISOString() corra el día cerca de
// medianoche según la zona horaria del servidor.
function formatoYYYYMMDD(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fechaEstimadaEntrega(
  modoEnvio: 'domicilio' | 'retiro' | null | undefined,
  desde: Date = new Date(),
): string {
  const fecha = modoEnvio === 'retiro' ? sumarDiasCorridos(desde, 2) : sumarDiasHabiles(desde, 5)
  return formatoYYYYMMDD(fecha)
}
