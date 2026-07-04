import { AnnouncementBar } from '@/components/public/announcement-bar'
import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'
import { WhatsAppButton } from '@/components/public/whatsapp-button'
import { CartProvider } from '@/lib/cart'
import { Toaster } from '@/components/ui/sonner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <Toaster richColors position="top-center" />
    </CartProvider>
  )
}
