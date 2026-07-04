import Link from 'next/link'
import { PrimaryButton } from '@/components/public/buttons'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <p className="font-script text-2xl text-muted">Página perdida entre las páginas</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold text-foreground">404</h1>
      <p className="mt-3 text-foreground/75">
        No encontramos lo que buscabas. Puede que el link esté roto o que la caja/kit ya no esté disponible.
      </p>
      <Link href="/productos" className="mt-8">
        <PrimaryButton>Ver catálogo</PrimaryButton>
      </Link>
    </div>
  )
}
