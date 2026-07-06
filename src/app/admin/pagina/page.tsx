import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SeccionesManager } from '@/components/admin/secciones-manager'
import { getSeccionesAdmin } from './actions'

export const metadata = { title: 'Página de inicio' }

export default async function AdminPaginaPage() {
  const secciones = await getSeccionesAdmin('home')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold">Página de inicio</h1>
      <p className="mt-1 text-muted-foreground">
        Arrastrá para reordenar, ocultá lo que no quieras mostrar y editá el texto de cada sección.
      </p>

      {secciones.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Todavía no se cargaron las secciones (corré la migración 0010 y el seed). Mientras tanto,
          la home pública muestra el contenido por defecto.
        </p>
      ) : (
        <div className="mt-6">
          <SeccionesManager seccionesIniciales={secciones} />
        </div>
      )}
    </div>
  )
}
