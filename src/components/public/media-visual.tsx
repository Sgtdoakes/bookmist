import Image from 'next/image'
import { esVideoUrl } from '@/lib/media'

// Reemplazo de <Image fill .../> que además soporta video: si la URL es de
// Cloudinary/un archivo de video (Fase 8b), renderiza <video> autoplay en
// loop y muteado en vez de <Image> — mismo tratamiento visual que un fondo
// de imagen (cubre el contenedor, sin controles). El contenedor padre ya
// tiene position:relative en todos los usos existentes, igual que requiere
// <Image fill>.
export function MediaVisual({
  url,
  alt,
  sizes,
  className = 'object-cover',
  priority,
}: {
  url: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}) {
  if (esVideoUrl(url)) {
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        aria-label={alt}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    )
  }
  return <Image src={url} alt={alt} fill sizes={sizes} className={className} priority={priority} />
}
