import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// CSP sin nonces (recomendación oficial de Next.js para apps que priorizan
// generación estática/ISR): un CSP con nonces obliga a renderizado dinámico
// en TODAS las páginas (sin caché de CDN), lo cual choca con el requisito de
// "lo más performante posible". Se documenta acá el trade-off: 'unsafe-inline'
// en script-src es lo que exige el propio bootstrap de Next.js sin nonces; no
// hay scripts de terceros ni contenido de usuario sin escapar (todo el HTML
// lo arma React, que escapa por defecto).
// Revisitado en la Fase 2 (catálogo/carrito/checkout): ninguna de las páginas
// nuevas usa cookies()/headers() ni datos por-request, así que siguen siendo
// estáticas/cacheables — el trade-off original sigue valiendo la pena. El
// checkout envía sus datos vía fetch a /api/checkout (Route Handler, siempre
// dinámico por naturaleza), no vía navegación de página, así que no fuerza
// rendering dinámico en el resto del sitio.
// Revisitado en la Fase 7 (SEO/Analytics): Google Analytics (@next/third-parties)
// SÍ es un script de terceros real — bug encontrado en producción el
// 2026-07-17, CSP nunca se actualizó al agregar el componente, así que
// gtag.js se cargaba en el HTML pero el navegador lo bloqueaba en silencio
// (0 datos en Analytics, sin ningún error visible salvo en la consola).
// Dominios de Google recomendados por su propia documentación de CSP para
// gtag.js. media-src es nuevo (Fase 8b): video de Cloudinary en <video>.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.googletagmanager.com${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co https://*.cdninstagram.com https://*.fbcdn.net https://*.google-analytics.com https://*.googletagmanager.com;
  media-src 'self' https://res.cloudinary.com;
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  // Los Server Actions capean el body en 1MB por defecto (Next.js) — subirImagen()
  // ya valida hasta 5MB (src/app/admin/media/actions.ts) pero sin esto cualquier
  // foto real de celular quedaba cortada por el framework antes de llegar ahí.
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    // El optimizador de imágenes de Vercel (free) tiene cupo bajo; igual que
    // en Martín Libros, servimos directo desde Supabase Storage/Cloudflare R2
    // (ya vienen redimensionadas, sin costo de egress).
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      // Fotos reales de Instagram (Fase 6k) — el CDN de Meta rota de
      // subdominio (scontent-xxx), de ahí el wildcard.
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      // TODO: agregar el hostname del bucket público de Cloudflare R2 cuando
      // se cree (ver README, sección de assets).
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\s{2,}/g, ' ').trim() },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig
