// "Productos"/"Preguntas frecuentes"/"Política de devolución" todavía no
// existen como páginas (llegan en la Fase 2 y siguientes) — apuntan a "#" en
// vez de a una ruta rota, igual que el wireframe original de Dani.
export const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '#' },
  { label: 'Contacto', href: '#' },
  { label: 'Preguntas frecuentes', href: '#' },
  { label: 'Política de devolución', href: '#' },
] as const
