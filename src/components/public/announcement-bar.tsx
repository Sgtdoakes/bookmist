import { textoCintillo, type CintilloConfig } from '@/lib/cintillo'

// La franja de arriba de todo. El texto se resuelve en textoCintillo() a
// partir de la config real (getCintilloConfig) y no acá: si Dani
// apaga el cintillo o cambia el descuento, la barra no puede quedar
// prometiendo algo distinto de lo que después cobra el checkout. Texto vacío
// = no se dibuja nada, ni siquiera la franja.
export function AnnouncementBar({ cintillo }: { cintillo: CintilloConfig }) {
  const texto = textoCintillo(cintillo)
  if (!texto) return null
  return (
    <div className="w-full bg-background py-2.5 text-center text-xs font-semibold tracking-wide text-foreground md:text-sm">
      {texto}
    </div>
  )
}
