import type { Metadata } from 'next'
import { Playfair_Display, Caveat, Nunito } from 'next/font/google'
import { getMarcaConfig } from '@/lib/configuracion'
import { organizationJsonLd, websiteJsonLd } from '@/lib/structured-data'
import { SITE_URL } from '@/lib/constants'
import './globals.css'

// Fuentes de marca (Manual de Marca Bookmist), cargadas con next/font en vez
// del @import del wireframe original: next/font auto-hospeda los archivos y
// evita el bloqueo de render de un @import de Google Fonts en <style>.
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  display: 'swap',
})

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  display: 'swap',
})

const description =
  'Tienda literaria online: cajas y kits literarios, libros y accesorios para lectores. Envíos a todo el país desde Argentina.'

// Pedido de Dani: que en Google se lea "Tienda Literaria", que es lo que la
// gente busca (y cómo se presentan las tiendas que aparecen arriba). Atado al
// nombre editable de la marca, así un cambio de nombre no deja el título viejo.
function tituloDelSitio(nombre: string) {
  return `${nombre} - Tienda Literaria`
}

export async function generateMetadata(): Promise<Metadata> {
  const marca = await getMarcaConfig()
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION
  const titulo = tituloDelSitio(marca.nombre)
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: titulo,
      template: `%s · ${marca.nombre}`,
    },
    description,
    keywords: [
      'Bookmist',
      'tienda literaria',
      'tienda literaria online',
      'cajas literarias',
      'kits literarios',
      'suscripción de libros Argentina',
      'cajas literarias Argentina',
      'regalos literarios Argentina',
      'book box',
    ],
    alternates: { canonical: '/' },
    // Sin esto Google no confirma la propiedad en Search Console. Queda
    // vacío (Next omite el campo) hasta que el usuario cree la propiedad y
    // pegue el código en GOOGLE_SITE_VERIFICATION (Vercel env var).
    ...(googleVerification && { verification: { google: googleVerification } }),
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url: SITE_URL,
      siteName: marca.nombre,
      title: titulo,
      description,
      ...(marca.logoUrl && { images: [{ url: marca.logoUrl }] }),
    },
    twitter: {
      card: 'summary',
      title: titulo,
      description,
    },
  }
}

// Overrides de color opcionales (Fase 6f-1): si Dani cargó colores propios
// desde /admin/configuracion, se pisan acá las 3 variables de acento del
// tema (globals.css). Si no cargó nada, no se inyecta nada y el sitio se ve
// exactamente igual que siempre — --background/--foreground (el contraste
// base, sin modo claro/oscuro) quedan siempre fijos, nunca editables.
function estilosDeColor(marca: Awaited<ReturnType<typeof getMarcaConfig>>) {
  const overrides: string[] = []
  if (marca.colorPrimario) overrides.push(`--primary: ${marca.colorPrimario};`)
  if (marca.colorSecundario) overrides.push(`--secondary: ${marca.colorSecundario};`)
  if (marca.colorAcento) overrides.push(`--accent: ${marca.colorAcento};`)
  return overrides.length > 0 ? `:root{${overrides.join('')}}` : null
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const marca = await getMarcaConfig()
  const jsonLd = { ...organizationJsonLd(marca), description }
  const sitioJsonLd = websiteJsonLd(marca, tituloDelSitio(marca.nombre))
  const colores = estilosDeColor(marca)

  return (
    <html
      lang="es-AR"
      className={`${playfair.variable} ${caveat.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {colores && <style dangerouslySetInnerHTML={{ __html: colores }} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sitioJsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
