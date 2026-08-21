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
  natural,
}: {
  url: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  // true = el archivo manda: ocupa todo el ancho y su alto sale de su propia
  // proporción, en vez de estirarse para cubrir un contenedor. Lo usa el
  // banner "solo imagen", donde la placa que diseñó Dani tiene que verse
  // entera y sin recortes.
  natural?: boolean
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
        className={natural ? `h-auto w-full ${className}` : `absolute inset-0 h-full w-full ${className}`}
      />
    )
  }
  if (natural) {
    // <img> y no <Image>: para respetar la proporción real hay que conocer
    // las dimensiones de antemano (o usar fill, que justamente recorta). Como
    // el sitio sirve las imágenes sin optimizador (images.unoptimized en
    // next.config.ts), <Image> tampoco aportaría nada más acá.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={`h-auto w-full ${className}`}
      />
    )
  }
  return <Image src={url} alt={alt} fill sizes={sizes} className={className} priority={priority} />
}
