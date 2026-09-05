'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

// Píxel de Meta (Facebook/Instagram): lo que deja ver desde el administrador
// de anuncios qué pasa después de que alguien hace clic en una publicidad, y
// armar públicos para volver a mostrarle avisos a quien ya pasó por el sitio.
// El bloque de adentro es tal cual lo entrega Events Manager; lo único que se
// tocó es sacar el ID a una variable de entorno, como el resto de las
// credenciales del proyecto.
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname()
  // El snippet de arriba ya manda el PageView de la primera carga. Sin este
  // flag, esa primera visita contaría dos veces.
  const primeraCarga = useRef(true)

  // Meta escribió ese snippet pensando en sitios donde cada página es una
  // carga nueva del navegador y el código corre de cero. Acá la navegación es
  // del lado del cliente: sin esto, el píxel solo vería la página por la que
  // entró el visitante y nada de lo que recorra después (catálogo, ficha de
  // producto, carrito, checkout).
  //
  // Mira el pathname y no los query params a propósito: filtrar el catálogo
  // por categoría no es visitar otra página, y `useSearchParams` obligaría a
  // renderizar del lado del cliente todo lo que cuelga de este layout.
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false
      return
    }
    window.fbq?.('track', 'PageView')
  }, [pathname])

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* Respaldo de Meta para navegadores sin JavaScript. Es un pixel de
            rastreo, no una imagen del sitio: por eso <img> pelado y no
            next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
