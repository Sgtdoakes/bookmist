import { GoogleAnalytics } from '@next/third-parties/google'
import {
  getMarcaConfig,
  getNavLinks,
  getCuponBienvenida,
  getCintilloConfig,
} from '@/lib/configuracion'
import { getCategorias } from '@/lib/productos'
import { getIsAdmin } from '@/lib/admin'
import { AnnouncementBar } from '@/components/public/announcement-bar'
import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'
import { WhatsAppButton } from '@/components/public/whatsapp-button'
import { PopupCupon } from '@/components/public/popup-cupon'
import { MetaPixel } from '@/components/public/meta-pixel'
import { CartProvider } from '@/lib/cart'
import { Toaster } from '@/components/ui/sonner'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [marca, navLinks, categorias, isAdmin, cupon, cintillo] = await Promise.all([
    getMarcaConfig(),
    getNavLinks(),
    getCategorias(),
    getIsAdmin(),
    getCuponBienvenida(),
    getCintilloConfig(),
  ])

  // GA4 y el píxel de Meta viven acá (no en el layout raíz) para que nunca
  // corran en /admin — y se apagan también para quien navega el sitio público
  // ya logueada como admin, para no mezclar los clics de Dani probando cosas
  // con tráfico de clientes real (con solo un puñado de visitas reales por
  // mes, unas pocas de Dani ya distorsionan los números; en el caso del píxel
  // además ensuciarían los públicos con los que Meta decide a quién mostrarle
  // los anuncios). Apagados sin credenciales, mismo patrón que
  // Andreani/Mercado Pago/Instagram.
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <CartProvider>
      {gaId && !isAdmin && <GoogleAnalytics gaId={gaId} />}
      {metaPixelId && !isAdmin && <MetaPixel pixelId={metaPixelId} />}
      <AnnouncementBar cintillo={cintillo} />
      <SiteHeader marca={marca} navLinks={navLinks} categorias={categorias} isAdmin={isAdmin} />
      <main className="flex-1">{children}</main>
      <SiteFooter marca={marca} navLinks={navLinks} />
      <WhatsAppButton />
      {/* No se le muestra a Dani mientras navega logueada su propio sitio. */}
      {cupon.activo && !isAdmin && <PopupCupon pct={cupon.pct} />}
      <Toaster richColors position="top-center" />
    </CartProvider>
  )
}
