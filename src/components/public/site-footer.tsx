import Link from 'next/link'
import Image from 'next/image'
import { CreditCard, Mail, Package } from 'lucide-react'
import type { MarcaConfig, NavLinkPublico } from '@/lib/configuracion'
import { Blob, BookDoodle } from '@/components/public/decorative'
import { SocialIcons } from '@/components/public/social-icons'

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-foreground/16 bg-foreground/3 px-[13px] py-1.5 text-[11px] font-bold tracking-[0.03em] text-secondary transition-all duration-300 hover:border-muted hover:text-foreground">
      {children}
    </span>
  )
}

export function SiteFooter({ marca, navLinks }: { marca: MarcaConfig; navLinks: NavLinkPublico[] }) {
  return (
    <footer className="relative w-full overflow-hidden bg-background pt-16 pb-8 md:pt-20">
      <Blob className="pointer-events-none absolute -bottom-32 -left-28 h-96 w-96 text-muted opacity-5" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Marca */}
        <div className="mb-12 flex items-center gap-2.5 md:mb-16">
          {marca.logoUrl ? (
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <Image src={marca.logoUrl} alt={marca.nombre} fill sizes="40px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <BookDoodle className="h-5 w-5 text-foreground" />
            </span>
          )}
          <span className="leading-none">
            <span className="block font-heading text-xl font-semibold text-foreground">{marca.nombre}</span>
            <span className="font-script -mt-0.5 block text-xs text-secondary">{marca.taglineFooter}</span>
          </span>
        </div>

        {/* Páginas / Contactanos / Redes */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 pb-14 md:grid-cols-3 md:pb-16">
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-foreground">Páginas</h3>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-secondary transition-colors duration-250 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-foreground">Contactanos</h3>
            <a
              href={`mailto:${marca.email}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition-colors duration-250 hover:text-foreground"
            >
              <Mail size={15} className="text-muted" />
              {marca.email}
            </a>

            <h3 className="mt-10 mb-5 text-xs font-bold uppercase tracking-[0.16em] text-foreground">Seguinos</h3>
            <SocialIcons instagram={marca.instagram} tiktok={marca.tiktok} />
          </div>

          <div className="col-span-2 flex flex-col gap-8 md:col-span-1">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                <CreditCard size={14} className="text-muted" />
                Método de pago
              </h3>
              <div className="flex flex-wrap gap-2">
                {marca.metodosPago.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                <Package size={14} className="text-muted" />
                Método de envío
              </h3>
              <div className="flex flex-wrap gap-2">
                {marca.metodosEnvio.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-foreground/12 pt-8 md:flex-row">
          <p className="text-center text-xs text-foreground/50 md:text-left">
            © {new Date().getFullYear()} {marca.nombre} — {marca.copyright}
          </p>
          <p className="font-script text-sm text-muted">Palabras que se sienten en las manos</p>
        </div>
      </div>
    </footer>
  )
}
