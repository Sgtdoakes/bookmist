import { getMarcaConfig, getNavLinks } from '@/lib/configuracion'
import { getCategorias } from '@/lib/productos'
import { AnnouncementBar } from '@/components/public/announcement-bar'
import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'
import { WhatsAppButton } from '@/components/public/whatsapp-button'
import { CartProvider } from '@/lib/cart'
import { Toaster } from '@/components/ui/sonner'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [marca, navLinks, categorias] = await Promise.all([getMarcaConfig(), getNavLinks(), getCategorias()])

  return (
    <CartProvider>
      <AnnouncementBar />
      <SiteHeader marca={marca} navLinks={navLinks} categorias={categorias} />
      <main className="flex-1">{children}</main>
      <SiteFooter marca={marca} navLinks={navLinks} />
      <WhatsAppButton />
      <Toaster richColors position="top-center" />
    </CartProvider>
  )
}
