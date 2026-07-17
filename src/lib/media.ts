const EXTENSIONES_VIDEO = ['.mp4', '.webm', '.mov', '.m4v']

// Todas las fotos de este sitio son URLs de archivo (Supabase Storage); los
// videos son URLs pegadas a mano desde Cloudinary (Fase 8b) — no hay un
// campo separado "es video", se distingue por la URL misma.
export function esVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const limpio = url.split('?')[0].toLowerCase()
  return EXTENSIONES_VIDEO.some((ext) => limpio.endsWith(ext)) || limpio.includes('/video/upload/')
}
