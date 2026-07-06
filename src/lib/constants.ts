import type { EstadoPedido, MetodoPago } from '@/types/db'

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

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
  mercadopago: 'Mercado Pago (QR, billetera o tarjeta)',
}

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

export const ESTADO_PEDIDO_BADGE: Record<EstadoPedido, string> = {
  pendiente: 'border-amber-400/50 text-amber-600',
  pagado: 'border-emerald-500/50 text-emerald-600',
  cancelado: 'border-red-400/50 text-red-600',
}

// Transiciones válidas de estado (no se puede saltar pasos ni revivir un
// pedido cancelado).
export const ESTADO_SIGUIENTE: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['cancelado'],
  cancelado: [],
}
