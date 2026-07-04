import type { Metadata } from 'next'
import { Playfair_Display, Caveat, Nunito } from 'next/font/google'
import { storeConfig } from '@/lib/store-config'
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeConfig.nombre} — Cajas y kits literarios`,
    template: `%s · ${storeConfig.nombre}`,
  },
  description,
  keywords: ['Bookmist', 'cajas literarias', 'kits literarios', 'suscripción de libros Argentina', 'book box'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: siteUrl,
    siteName: storeConfig.nombre,
    title: `${storeConfig.nombre} — Cajas y kits literarios`,
    description,
  },
  twitter: {
    card: 'summary',
    title: `${storeConfig.nombre} — Cajas y kits literarios`,
    description,
  },
}

const jsonLd = { ...organizationJsonLd(), description }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es-AR"
      className={`${playfair.variable} ${caveat.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
