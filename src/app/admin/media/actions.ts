'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Ok = { ok: true; url: string }
type Err = { ok: false; error: string }

const BUCKET = 'catalogo'
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5 MB

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
  carpeta: 'productos' | 'items',
  entidadId: string,
): Promise<Ok | Err> {
  if (!(await usuarioAutenticado())) return { ok: false, error: 'Tu sesión expiró.' }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return { ok: false, error: 'Formato no válido. Usá JPG, PNG, WEBP o AVIF.' }
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return { ok: false, error: 'La imagen no puede pesar más de 5 MB.' }
  }

  const ext = archivo.type.split('/')[1].toLowerCase()
  const path = `${carpeta}/${entidadId}/${randomUUID()}.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage.from(BUCKET).upload(path, archivo, {
    contentType: archivo.type,
    upsert: false,
  })
  if (error) return { ok: false, error: 'No se pudo subir la imagen.' }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
