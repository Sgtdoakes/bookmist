import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NotaForm } from '@/components/admin/nota-form'
import { getProductosParaNota } from '../datos'

export const metadata = { title: 'Nueva nota' }

export default async function NuevaNotaPage() {
  const productos = await getProductosParaNota()
  // El id nace acá y no en la base: la foto se puede subir antes del primer
  // guardado (el uploader la guarda en blog/<id>/).
  const id = crypto.randomUUID()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al blog
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Nueva nota</h1>
      <NotaForm idNuevo={id} productosDisponibles={productos} />
    </div>
  )
}
