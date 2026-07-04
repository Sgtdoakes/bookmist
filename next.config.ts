import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// CSP sin nonces (recomendación oficial de Next.js para apps que priorizan
// generación estática/ISR): un CSP con nonces obliga a renderizado dinámico
// en TODAS las páginas (sin caché de CDN), lo cual choca con el requisito de
// "lo más performante posible" para una landing mayormente estática. Se
// documenta acá el trade-off: 'unsafe-inline' en script-src es lo que exige
// el propio bootstrap de Next.js sin nonces; no hay scripts de terceros ni
// contenido de usuario sin escapar en esta fase (todo el HTML lo arma React,
// que escapa por defecto). Revisitar con nonces + rendering dinámico cuando
// checkout/formularios (Fase 2+) hagan que ese costo de performance valga la pena.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  images: {
    // El optimizador de imágenes de Vercel (free) tiene cupo bajo; igual que
    // en Martín Libros, servimos directo desde Supabase Storage/Cloudflare R2
    // (ya vienen redimensionadas, sin costo de egress).
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
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
