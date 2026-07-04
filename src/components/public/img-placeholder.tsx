import { ImageIcon } from 'lucide-react'

// Placeholder de imagen — reemplaza fotografía real mientras Daniela no haya
// entregado las fotos definitivas de cada caja/kit.
export function ImgPlaceholder({
  label,
  className = '',
  dark = false,
  iconSize = 26,
}: {
  label: string
  className?: string
  dark?: boolean
  iconSize?: number
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden ${
        dark
          ? 'bg-[repeating-linear-gradient(135deg,var(--background)_0px,var(--background)_10px,#493c6b_10px,#493c6b_20px)]'
          : 'bg-[repeating-linear-gradient(135deg,var(--foreground)_0px,var(--foreground)_10px,#ded3f0_10px,#ded3f0_20px)]'
      } ${className}`}
    >
      <ImageIcon size={iconSize} strokeWidth={1.3} className={dark ? 'text-muted' : 'text-primary'} />
      <span
        className={`text-xs uppercase tracking-wide font-semibold px-4 text-center ${
          dark ? 'text-foreground' : 'text-primary'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
