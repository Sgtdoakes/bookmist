import type { MetodoPago } from '@/types/db'

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
}
