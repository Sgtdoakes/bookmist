// El porcentaje llega por prop desde el layout (que lo lee de la config real)
// y no hardcodeado: si Dani cambia el descuento, la barra no puede quedar
// prometiendo un número distinto al que después cobra el checkout.
export function AnnouncementBar({ descuentoPct }: { descuentoPct: number }) {
  if (descuentoPct <= 0) return null
  return (
    <div className="w-full bg-background py-2.5 text-center text-xs font-semibold tracking-wide text-foreground md:text-sm">
      ✨ {descuentoPct}% de descuento con transferencia ✨
    </div>
  )
}
