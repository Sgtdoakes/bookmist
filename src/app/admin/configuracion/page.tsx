import Link from 'next/link'
import { ChevronLeft, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMarcaConfig, getCuentasPago } from '@/lib/configuracion'
import { ConfiguracionForm } from '@/components/admin/configuracion-form'
import { NavLinksEditor } from '@/components/admin/nav-links-editor'
import { CuentasPagoEditor } from '@/components/admin/cuentas-pago-editor'
import type { NavLink } from '@/types/db'

export const metadata = { title: 'Configuración' }

async function getNavLinksAdmin(): Promise<NavLink[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('nav_links').select('*').order('orden', { ascending: true })
  if (error) return []
  return data ?? []
}

export default async function AdminConfiguracionPage() {
  const [marca, navLinks, cuentasPago] = await Promise.all([
    getMarcaConfig(),
    getNavLinksAdmin(),
    getCuentasPago(),
  ])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="mt-1 text-muted-foreground">
        Nombre, contacto, redes y colores de la marca, y los links de navegación del header y el footer.
      </p>

      <div className="mt-6 space-y-8">
        <ConfiguracionForm marcaInicial={marca} />
        <CuentasPagoEditor cuentasIniciales={cuentasPago} />

        {/* El cupón de bienvenida se editaba acá cuando era el único que
            existía. Ahora es uno más de la lista, así que el editor se fue a
            /admin/cupones — pero este cartel queda porque quien lo buscaba
            acá lo va a seguir buscando acá. */}
        <Link
          href="/admin/cupones"
          className="flex items-start gap-3 rounded-lg border p-5 transition-colors hover:border-primary hover:bg-foreground/5"
        >
          <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-bold tracking-wide text-muted-foreground uppercase">Cupones</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              El cupón de bienvenida y los que se reparten ahora se editan juntos en su propia pantalla.
            </span>
          </span>
        </Link>

        <NavLinksEditor linksIniciales={navLinks} />
      </div>
    </div>
  )
}
