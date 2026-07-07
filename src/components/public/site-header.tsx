'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { MarcaConfig, NavLinkPublico } from '@/lib/configuracion'
import { BookDoodle } from '@/components/public/decorative'
import { CartButton } from '@/components/public/cart-button'

export function SiteHeader({ marca, navLinks }: { marca: MarcaConfig; navLinks: NavLinkPublico[] }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/12 bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
            <BookDoodle className="h-5 w-5 text-background" />
          </span>
          <span className="leading-none">
            <span className="block font-heading text-xl font-semibold text-foreground md:text-2xl">
              {marca.nombre}
            </span>
            <span className="font-script -mt-0.5 block text-xs text-secondary">{marca.taglineHeader}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative text-sm font-semibold text-foreground transition-colors hover:text-muted"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-muted transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartButton />
          <button
            className="rounded-full p-2 text-foreground lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-foreground/12 px-6 pb-5 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="pt-3 text-sm font-semibold text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
