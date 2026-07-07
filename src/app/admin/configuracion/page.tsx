import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMarcaConfig } from '@/lib/configuracion'
import { ConfiguracionForm } from '@/components/admin/configuracion-form'
import { NavLinksEditor } from '@/components/admin/nav-links-editor'
import type { NavLink } from '@/types/db'

export const metadata = { title: 'Configuración' }

async function getNavLinksAdmin(): Promise<NavLink[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('nav_links').select('*').order('orden', { ascending: true })
  if (error) return []
  return data ?? []
}

export default async function AdminConfiguracionPage() {
  const [marca, navLinks] = await Promise.all([getMarcaConfig(), getNavLinksAdmin()])

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
        <NavLinksEditor linksIniciales={navLinks} />
      </div>
    </div>
  )
}
