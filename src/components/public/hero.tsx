'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Blob } from '@/components/public/decorative'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { PrimaryButton } from '@/components/public/buttons'
import type { HeroConfig } from '@/lib/secciones'

// El carrusel del hero queda como imagen estática con puntos clicables (igual
// que el wireframe de Dani): todavía no hay fotos reales para armar un
// carrusel funcional de verdad. Se activa cuando Bookmist tenga fotografía
// propia de las cajas/kits.
export function Hero({ eyebrow, titulo, subtitulo, ctaTexto }: HeroConfig) {
  const [activeDot, setActiveDot] = useState(0)

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--background)_0%,var(--primary)_100%)]">
      <Blob className="absolute -top-16 -left-20 h-72 w-72 animate-[floaty_10s_ease-in-out_infinite] text-muted opacity-20" />
      <Blob className="absolute -bottom-24 -right-16 h-96 w-96 animate-[floaty_14s_ease-in-out_infinite_-4s] text-foreground opacity-10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-10 md:py-28">
        <div>
          <p className="font-script mb-2 text-2xl text-muted md:text-3xl">{eyebrow}</p>
          <h1 className="mb-5 font-heading text-4xl font-semibold leading-tight text-foreground md:text-6xl">
            {titulo}
          </h1>
          <p className="mb-8 max-w-md text-base text-muted md:text-lg">{subtitulo}</p>
          <PrimaryButton>
            {ctaTexto} <ArrowRight size={17} />
          </PrimaryButton>
        </div>

        <div className="relative">
          <ImgPlaceholder
            label="Imagen / Carrusel — Kit literario"
            dark
            iconSize={34}
            className="h-72 w-full rounded-3xl shadow-2xl md:h-96"
          />
          <div className="mt-5 flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setActiveDot(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeDot === i ? 'w-[22px] bg-foreground' : 'w-2 bg-foreground/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
