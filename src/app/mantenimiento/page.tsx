import { BookOpen } from 'lucide-react'
import { getModoMantenimiento } from '@/lib/mantenimiento'
import { getMarcaConfig } from '@/lib/configuracion'
import { SocialIcons } from '@/components/public/social-icons'
import { Blob } from '@/components/public/decorative'

export const metadata = { title: 'Volvemos pronto' }

export default async function MantenimientoPage() {
  const [{ mensaje }, marca] = await Promise.all([getModoMantenimiento(), getMarcaConfig()])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center text-foreground">
      <Blob className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 text-muted opacity-10" />
      <Blob className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 text-primary opacity-10" />

      <div className="relative flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
          <BookOpen className="h-5 w-5 text-background" />
        </span>
        <span className="font-heading text-xl font-semibold">{marca.nombre}</span>
      </div>

      <h1 className="relative mt-8 max-w-lg font-heading text-2xl font-semibold md:text-3xl">
        Volvemos pronto
      </h1>
      <p className="relative mt-3 max-w-md text-foreground/75">{mensaje}</p>

      <p className="relative mt-8 text-sm text-foreground/60">Seguinos, no nos vamos a ningún lado:</p>
      <div className="relative mt-3">
        <SocialIcons instagram={marca.instagram} tiktok={marca.tiktok} />
      </div>
    </div>
  )
}
