import { GoogleAnalytics } from '@next/third-parties/google'
import { getMarcaConfig, getNavLinks, getCuponBienvenida } from '@/lib/configuracion'
import { getCategorias } from '@/lib/productos'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementBar } from '@/components/public/announcement-bar'
import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'
import { WhatsAppButton } from '@/components/public/whatsapp-button'
import { PopupCupon } from '@/components/public/popup-cupon'
import { CartProvider } from '@/lib/cart'
import { Toaster } from '@/components/ui/sonner'

// isAdmin: verificado contra el servidor de Supabase Auth (auth.getUser(),
// no auth.getSession()) — getUser() valida el JWT con Supabase en cada
// llamada en vez de solo leer la cookie local, así que no se puede falsear
// desde el cliente. Con eso alcanza para decidir si mostrar el atajo al
// panel: nadie más que Dani, ya logueada, va a ver ese link en el HTML.
async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [marca, navLinks, categorias, isAdmin, cupon] = await Promise.all([
    getMarcaConfig(),
    getNavLinks(),
    getCategorias(),
    getIsAdmin(),
    getCuponBienvenida(),
  ])

  // GA4 vive acá (no en el layout raíz) para que nunca corra en /admin — y
  // se apaga también para quien navega el sitio público ya logueada como
  // admin, para no mezclar los clics de Dani probando cosas con tráfico de
  // clientes real (con solo un puñado de visitas reales por mes, unas pocas
  // de Dani ya distorsionan los números). Apagado sin credenciales, mismo
  // patrón que Andreani/Mercado Pago/Instagram.
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <CartProvider>
      {gaId && !isAdmin && <GoogleAnalytics gaId={gaId} />}
      <AnnouncementBar />
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
