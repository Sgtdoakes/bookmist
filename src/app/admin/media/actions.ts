'use server'

import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Ok = { ok: true; url: string }
type Err = { ok: false; error: string }

const BUCKET = 'catalogo'
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5 MB

// Todo lo que entra se guarda como WebP. Motivo (agosto 2026): las fotos se
// subían en PNG tal cual salían del editor — 2 a 3 MB cada una — y como el
// sitio las sirve sin optimizador (images.unoptimized en next.config.ts),
// cada visita se bajaba el archivo entero. Eso hizo que Supabase midiera
// 19,83 GB de egress contra los 5 GB del plan gratis y amenazara con cortar
// el proyecto. Convertir el catálogo entero a WebP lo bajó de 137 MB a 7,5
// MB; esto es para que no vuelva a pasar con las fotos nuevas.
//
// 1600px de ancho cubre de sobra la ficha de producto en pantallas retina, y
// withoutEnlargement evita agrandar (y empeorar) una imagen chica.
const ANCHO_MAXIMO = 1600
const CALIDAD_WEBP = 80
// 30 días. Ojo con el formato: NO va el "max-age=" acá. @supabase/storage-js
// arma el header como `max-age=${cacheControl}` (dist/index.mjs), así que lo
// que se manda es solo el valor y lo que sirve el servidor termina siendo
// "public, max-age=2592000, immutable".
// Esto estuvo mal entre el 2026-08-22 y el 2026-09-10: la constante decía
// 'max-age=2592000, immutable' y el header salía duplicado, "public,
// max-age=max-age=2592000, immutable". Un max-age con valor inválido lo
// descarta el navegador, así que los 51 archivos subidos en esa ventana se
// quedaron sin los 30 días de caché y cada visita repetida los volvía a
// bajar — egress pago por nada. Verificado contra el servidor real y contra
// la metadata de los objetos, no por lectura del código solo.
// `immutable` es correcto acá porque cada archivo se sube con un nombre
// UUID nuevo: el contenido de una URL dada no cambia nunca, así que el
// navegador no necesita revalidar.
const CACHE_CONTROL = '2592000, immutable'

async function usuarioAutenticado() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

// Sube una imagen (portada o galería) de un producto o ítem de biblioteca al
// bucket `catalogo`. Devuelve la URL pública para guardar en la fila
// correspondiente — la persistencia queda a cargo de quien llama esto
// (mismo patrón de responsabilidad que subirPortada() en Martín Libros).
export async function subirImagen(
  archivo: File,
  carpeta: 'productos' | 'items' | 'secciones' | 'blog',
  entidadId: string,
): Promise<Ok | Err> {
  if (!(await usuarioAutenticado())) return { ok: false, error: 'Tu sesión expiró.' }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return { ok: false, error: 'Formato no válido. Usá JPG, PNG, WEBP o AVIF.' }
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return { ok: false, error: 'La imagen no puede pesar más de 5 MB.' }
  }

  // .rotate() sin argumentos aplica la orientación del EXIF antes de que se
  // pierda al reencodear: si no, las fotos sacadas de costado con el celular
  // se guardan giradas.
  let webp: Buffer
  try {
    webp = await sharp(Buffer.from(await archivo.arrayBuffer()))
      .rotate()
      .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer()
  } catch {
    return { ok: false, error: 'No pudimos procesar esa imagen. Probá con otro archivo.' }
  }

  const path = `${carpeta}/${entidadId}/${randomUUID()}.webp`

  const admin = createAdminClient()
  const { error } = await admin.storage.from(BUCKET).upload(path, webp, {
    contentType: 'image/webp',
    cacheControl: CACHE_CONTROL,
    upsert: false,
  })
  if (error) return { ok: false, error: 'No se pudo subir la imagen.' }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
