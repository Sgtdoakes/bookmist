'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, LayoutDashboard, Menu, X } from 'lucide-react'
import type { MarcaConfig, NavLinkPublico } from '@/lib/configuracion'
import { BookDoodle } from '@/components/public/decorative'
import { CartButton } from '@/components/public/cart-button'
import type { Categoria } from '@/types/db'

// "Destacados" es una etiqueta de marketing (los productos que Dani elige
// resaltar), no una categoría temática real — se excluye del menú, mismo
// criterio que ya usa el admin al listar categorías en la tabla de productos.
function categoriasDelMenu(categorias: Categoria[]) {
  return categorias.filter((c) => c.slug !== 'destacados')
}

export function SiteHeader({
  marca,
  navLinks,
  categorias,
  isAdmin = false,
}: {
  marca: MarcaConfig
  navLinks: NavLinkPublico[]
  categorias: Categoria[]
  isAdmin?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriasMovilAbiertas, setCategoriasMovilAbiertas] = useState(false)
  const categoriasMenu = categoriasDelMenu(categorias)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/12 bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          {marca.logoUrl ? (
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <Image src={marca.logoUrl} alt={marca.nombre} fill sizes="40px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
              <BookDoodle className="h-5 w-5 text-background" />
            </span>
          )}
          <span className="leading-none">
            <span className="block font-heading text-xl font-semibold text-foreground md:text-2xl">
              {marca.nombre}
            </span>
            <span className="font-script -mt-0.5 block text-xs text-secondary">{marca.taglineHeader}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) =>
            link.href === '/productos' && categoriasMenu.length > 0 ? (
              <div key={link.label} className="group relative py-2">
                <Link
                  href={link.href}
                  className="relative flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-muted"
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                  <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-muted transition-all duration-300 group-hover:w-full" />
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 min-w-52 -translate-x-1/2 rounded-xl border border-foreground/12 bg-background p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  {categoriasMenu.map((c) => (
                    <Link
                      key={c.id}
                      href={`/productos#${c.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      {c.nombre}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="group relative text-sm font-semibold text-foreground transition-colors hover:text-muted"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-muted transition-all duration-300 group-hover:w-full" />
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Ir al panel de administración"
              title="Panel"
              className="hidden rounded-full p-2 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <LayoutDashboard size={20} />
            </Link>
          )}
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
        <div className="flex flex-col gap-1 border-t border-foreground/12 px-6 pb-5 lg:hidden">
          {navLinks.map((link) =>
            link.href === '/productos' && categoriasMenu.length > 0 ? (
              <div key={link.label} className="pt-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCategoriasMovilAbiertas((v) => !v)}
                    aria-label={categoriasMovilAbiertas ? 'Ocultar categorías' : 'Mostrar categorías'}
                    aria-expanded={categoriasMovilAbiertas}
                    className="p-1 text-foreground"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${categoriasMovilAbiertas ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {categoriasMovilAbiertas && (
                  <div className="mt-2 flex flex-col gap-3 border-l border-foreground/12 pl-4">
                    {categoriasMenu.map((c) => (
                      <Link
                        key={c.id}
                        href={`/productos#${c.slug}`}
                        className="text-sm text-foreground/85"
                        onClick={() => setMenuOpen(false)}
                      >
                        {c.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="pt-3 text-sm font-semibold text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="mt-1 flex items-center gap-1.5 border-t border-foreground/12 pt-3 text-sm font-semibold text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard size={16} />
              Panel
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
