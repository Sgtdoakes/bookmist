'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImgPlaceholder } from '@/components/public/img-placeholder'

// Imagen principal + galería con miniaturas clicleables — antes las fotos
// secundarias se mostraban en una grilla fija sin forma de verlas más
// grandes ni de reemplazar la imagen principal.
export function ProductGallery({
  imagenPrincipal,
  imagenesGaleria,
  nombre,
}: {
  imagenPrincipal: string | null
  imagenesGaleria: string[]
  nombre: string
}) {
  const todas = imagenPrincipal ? [imagenPrincipal, ...imagenesGaleria] : imagenesGaleria
  const [activa, setActiva] = useState<string | null>(todas[0] ?? null)

  if (!activa) {
    return <ImgPlaceholder label="Imagen producto" className="aspect-[3/4] w-full rounded-3xl shadow-xl" />
  }

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-xl">
        <Image
          src={activa}
          alt={nombre}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {todas.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {todas.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActiva(url)}
              aria-label={`Ver foto ${i + 1} de ${nombre}`}
              aria-pressed={url === activa}
              className={`relative aspect-[3/4] overflow-hidden rounded-xl transition ${
                url === activa ? 'ring-2 ring-primary' : 'ring-1 ring-transparent hover:ring-border'
              }`}
            >
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
