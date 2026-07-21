'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Blob } from '@/components/public/decorative'
import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { MediaVisual } from '@/components/public/media-visual'
import { PrimaryButton } from '@/components/public/buttons'
import { resolverAlineacion, resolverFondo, resolverTamano, paddingTopVars, tieneFondo } from '@/lib/estilo-secciones'
import type { HeroConfig } from '@/lib/secciones'

const INTERVALO_MS = 6000

// Sin fotos cargadas todavía: placeholder con el wireframe original. Con 1
// sola foto/video, queda fijo. Con 2+ rota solo cada unos segundos (fundido
// por opacidad, sin librería de carrusel) y los puntos pasan a ser
// navegación real — se pausa al pasar el mouse para poder mirar bien.
export function Hero({ eyebrow, titulo, subtitulo, ctaTexto, imagenes, estilo }: HeroConfig) {
  const [activoBruto, setActivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (imagenes.length < 2 || pausado) return
    const id = setInterval(() => setActivo((i) => (i + 1) % imagenes.length), INTERVALO_MS)
    return () => clearInterval(id)
  }, [imagenes.length, pausado])

  // Si se saca una foto desde el admin y el índice activo queda afuera de
  // rango, se calcula al vuelo en vez de mostrar ningún slide (evita un
  // setState extra dentro de un efecto solo para "corregir" el índice).
  const activo = imagenes.length > 0 ? activoBruto % imagenes.length : 0

  // Default = el degradé violeta original de la marca; un fondo elegido a
  // mano lo reemplaza. Mismo criterio para el padding: se preserva el
  // tamaño original hasta que se elija uno explícitamente.
  const fondoClase = resolverFondo(estilo) || 'bg-[linear-gradient(135deg,var(--background)_0%,var(--primary)_100%)]'
  const padding = estilo?.tamano ? resolverTamano(estilo).padding : 'py-20 md:py-28'
  const alineacion = resolverAlineacion(estilo)
  const textoAlineado = estilo?.alineacion ? `flex flex-col ${alineacion.items} ${alineacion.texto}` : ''

  return (
    <section
      data-fondo={tieneFondo(estilo)}
      style={paddingTopVars(estilo, ['5rem', '7rem'])}
      className={`relative overflow-hidden ${fondoClase}`}
    >
      <Blob className="absolute -top-16 -left-20 h-72 w-72 animate-[floaty_10s_ease-in-out_infinite] text-muted opacity-20" />
      <Blob className="absolute -bottom-24 -right-16 h-96 w-96 animate-[floaty_14s_ease-in-out_infinite_-4s] text-foreground opacity-10" />

      <div className={`relative mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:px-10 ${padding}`}>
        <div className={textoAlineado}>
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
          {imagenes.length > 0 ? (
            <div
              className="relative h-72 w-full overflow-hidden rounded-3xl shadow-2xl md:h-96"
              onMouseEnter={() => setPausado(true)}
              onMouseLeave={() => setPausado(false)}
            >
              {imagenes.map((url, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    i === activo ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={i !== activo}
                >
                  <MediaVisual url={url} alt={titulo} sizes="(max-width: 768px) 100vw, 50vw" priority={i === 0} />
                </div>
              ))}
            </div>
          ) : (
            <ImgPlaceholder
              label="Imagen / Carrusel — Kit literario"
              dark
              iconSize={34}
              className="h-72 w-full rounded-3xl shadow-2xl md:h-96"
            />
          )}

          {imagenes.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {imagenes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivo(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === activo}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activo === i ? 'w-[22px] bg-foreground' : 'w-2 bg-foreground/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
