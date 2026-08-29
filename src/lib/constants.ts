import type { EstadoPedido, MetodoPago } from '@/types/db'

// Dominio real de producción (bookmist.com.ar) — usado como fallback para
// canonical/OG/sitemap/robots cuando NEXT_PUBLIC_SITE_URL no está seteada
// (ej. builds locales o un deploy que todavía no cargó la env var en Vercel).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.com.ar'

// "Contacto"/"Preguntas frecuentes"/"Política de devolución" todavía no
// existen como páginas propias — apuntan a "#" en vez de a una ruta rota,
// igual que el wireframe original de Dani. "Productos" ya tiene página real
// (Fase 2).
export const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Contacto', href: '#' },
  { label: 'Preguntas frecuentes', href: '#' },
  { label: 'Política de devolución', href: '#' },
] as const

// Rastreo público de Andreani. Vive acá y no en src/lib/andreani.ts porque
// ese módulo es `server-only` (tiene las credenciales) y este link lo arma
// también el panel, que es un componente cliente. Si Andreani cambia la URL
// de su rastreo, este es el único lugar a tocar.
export function andreaniSeguimientoUrl(numero: string): string {
  return `https://www.andreani.com/#!/informacionEnvio/${encodeURIComponent(numero.trim())}`
}

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  transferencia: 'Transferencia bancaria',
  deposito: 'Depósito bancario',
  efectivo: 'Efectivo',
  mercadopago: 'Mercado Pago (tarjeta en cuotas, QR o billetera)',
}

// Los mismos medios, en dos palabras. METODO_PAGO_LABEL explica el método
// completo porque es lo que se lee al elegir cómo pagar; este va adentro de
// frases ("solo para pagos con Mercado Pago") donde el paréntesis largo
// sobra.
export const METODO_PAGO_CORTO: Record<MetodoPago, string> = {
  transferencia: 'transferencia',
  deposito: 'depósito bancario',
  efectivo: 'efectivo',
  mercadopago: 'Mercado Pago',
}

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ESTADO_PEDIDO_BADGE: Record<EstadoPedido, string> = {
  pendiente: 'border-amber-400/50 text-amber-600',
  pagado: 'border-emerald-500/50 text-emerald-600',
  enviado: 'border-sky-400/50 text-sky-600',
  entregado: 'border-indigo-400/50 text-indigo-600',
  cancelado: 'border-red-400/50 text-red-600',
}

// Transiciones válidas de estado (no se puede saltar pasos ni revivir un
// pedido cancelado). 'entregado' es terminal: el paquete ya está en manos del
// cliente, cancelarlo ahí no describiría nada real — una devolución es otra
// cosa y hoy se maneja fuera del sistema.
export const ESTADO_SIGUIENTE: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
}

// Estados en los que productos.stock YA fue descontado de verdad (pasa al
// confirmar el pago, ver src/lib/pedidos.ts). Cancelar desde cualquiera de
// estos tiene que reponer; cancelar un 'pendiente' no, porque nunca se
// descontó — ahí el stock solo estaba reservado (src/lib/reservas.ts).
export const ESTADOS_CON_STOCK_DESCONTADO: EstadoPedido[] = ['pagado', 'enviado', 'entregado']

// Cómo se le cuenta cada estado a quien compró. El panel dice "Pagado"
// porque a Dani le importa la plata; al cliente le importa su paquete, así
// que lee otra cosa. `activo` distingue los estados donde el pedido sigue su
// curso de los finales (para no mostrar, por ejemplo, "te avisamos cuando lo
// despachemos" en un pedido cancelado).
export const ESTADO_PEDIDO_PUBLICO: Record<
  EstadoPedido,
  { titulo: string; detalle: string; activo: boolean }
> = {
  pendiente: {
    titulo: 'Pedido recibido',
    detalle: 'Estamos esperando que se acredite el pago para prepararlo.',
    activo: true,
  },
  pagado: {
    titulo: 'Pago confirmado',
    detalle: 'Ya tenemos tu pago. Estamos preparando tu pedido para despacharlo.',
    activo: true,
  },
  enviado: {
    titulo: 'En camino',
    detalle: 'Tu pedido ya viaja hacia vos.',
    activo: true,
  },
  entregado: {
    titulo: 'Entregado',
    detalle: '¡Tu pedido llegó! Gracias por comprar en Bookmist.',
    activo: false,
  },
  cancelado: {
    titulo: 'Pedido cancelado',
    detalle: 'Este pedido fue cancelado. Si creés que es un error, escribinos.',
    activo: false,
  },
}
