import type { Metadata } from 'next'
import { Playfair_Display, Caveat, Nunito } from 'next/font/google'
import { getMarcaConfig } from '@/lib/configuracion'
import { organizationJsonLd } from '@/lib/structured-data'
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookmist.ar'
const description =
  'Cajas y kits literarios curados: libros elegidos + accesorios pensados para vivir cada historia. Envíos a todo el país.'

export async function generateMetadata(): Promise<Metadata> {
  const marca = await getMarcaConfig()
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${marca.nombre} — Cajas y kits literarios`,
      template: `%s · ${marca.nombre}`,
    },
    description,
    keywords: ['Bookmist', 'cajas literarias', 'kits literarios', 'suscripción de libros Argentina', 'book box'],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      url: siteUrl,
      siteName: marca.nombre,
      title: `${marca.nombre} — Cajas y kits literarios`,
      description,
    },
    twitter: {
      card: 'summary',
      title: `${marca.nombre} — Cajas y kits literarios`,
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
        {children}
      </body>
    </html>
  )
}
