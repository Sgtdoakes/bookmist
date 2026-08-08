import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SuscriptoresManager } from '@/components/admin/suscriptores-manager'
import type { SuscriptorNewsletter } from '@/types/db'

export const metadata = { title: 'Suscriptores' }

async function getSuscriptores(): Promise<SuscriptorNewsletter[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suscriptores_newsletter')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export default async function AdminSuscriptoresPage() {
  const suscriptores = await getSuscriptores()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Suscriptores</h1>
      <p className="mt-1 text-muted-foreground">
        Quienes dejaron su mail en el popup del sitio. Se puede descargar la lista para abrirla en Excel.
      </p>

      <div className="mt-6">
        <SuscriptoresManager suscriptoresIniciales={suscriptores} />
      </div>
    </div>
  )
}
