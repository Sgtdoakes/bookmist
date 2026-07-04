import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Botones "pill" de marca (no el Button de shadcn/ui: el diseño de Dani usa
// una forma y animación de hover propias que no calzan con los variants por
// defecto de shadcn). shadcn/ui Button queda reservado para el panel admin.

export function PrimaryButton({
  children,
  className = '',
  ...props
}: { children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold tracking-wide text-primary-foreground transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-background ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  className = '',
  ...props
}: { children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-foreground/45 text-foreground transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
