// Generación y validación de slugs para productos (cajas/kits).
// El formato debe coincidir con el check constraint `productos_slug_formato`
// de supabase/migrations/0001_init.sql: minúsculas, sin tildes, palabras
// separadas por un solo guion, sin guion al inicio/final.

const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function generarSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '') // saca tildes/diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // cualquier no alfanumérico -> guion
    .replace(/-+/g, '-') // colapsa guiones consecutivos
    .replace(/^-|-$/g, '') // recorta guiones al borde
}

export function esSlugValido(slug: string): boolean {
  return SLUG_VALIDO.test(slug)
}
