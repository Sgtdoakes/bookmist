// Datos de la marca, configurables por variables de entorno.
// Los valores por defecto corresponden a Bookmist. Sin local físico: no hay
// dirección/horarios/mapa (a diferencia de Martín Libros). El costo de envío
// ya no es un valor fijo acá: se resuelve por zona (ver src/lib/zonas.ts).

export const storeConfig = {
  nombre: process.env.NEXT_PUBLIC_STORE_NOMBRE ?? 'Bookmist',
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? 'hola@bookmist.ar',
  // Número de WhatsApp en formato internacional, solo dígitos (ej: 5491122334455).
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://www.instagram.com/bookmist.ar/',
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? '@bookmist.ar',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://www.tiktok.com/@bookmist.ar',
} as const

export type StoreConfig = typeof storeConfig
