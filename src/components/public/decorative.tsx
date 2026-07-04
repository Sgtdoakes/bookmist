// Elementos gráficos de marca: manchas de acuarela + ilustraciones a lápiz
// ("Calidez artesanal" del Manual de Marca Bookmist).

export function Blob({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      <path
        fill="currentColor"
        d="M45.3,-58.4C58.5,-49.9,68.7,-35.6,72.7,-19.6C76.8,-3.6,74.7,14.1,66.7,28.5C58.7,42.9,44.8,54,29.1,61.5C13.4,69,-4.1,72.9,-20.5,69.6C-36.9,66.3,-52.2,55.8,-62.1,41.5C-72,27.2,-76.5,9.1,-74.5,-8.2C-72.5,-25.5,-64,-42,-51,-51.2C-38,-60.4,-19,-62.3,-1,-60.9C17,-59.5,34,-66.9,45.3,-58.4Z"
        transform="translate(100 100)"
      />
    </svg>
  )
}

export function BookDoodle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M32 9 C25 5.5, 13 5, 5 8.5 V33 C13 29.5, 25 30, 32 33.5 C39 30, 51 29.5, 59 33 V8.5 C51 5, 39 5.5, 32 9 Z" />
      <path d="M32 9 V33.5" />
    </svg>
  )
}

export function FeatherDoodle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 40 64"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 4 C10 14 6 30 10 46 C13 56 18 60 20 62 C22 58 20 50 24 44 C30 36 32 20 20 4Z" />
      <path d="M20 10 L20 58" />
      <path d="M20 20 L12 26 M20 30 L11 37 M20 40 L13 47" />
    </svg>
  )
}

// lucide-react quitó los logos de marcas (Instagram incluido) de su set de
// íconos por motivos de licencia/alcance — se arma a mano, mismo estilo
// "stroke" que el resto de los íconos de lucide para que no se note el salto.
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.5 3v10.9a3.6 3.6 0 1 1-3.6-3.6" />
      <path d="M15.5 3.2c.4 2.4 2.2 4.2 4.5 4.5" />
    </svg>
  )
}

export function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 py-1" aria-hidden="true">
      <span className="h-px w-14 md:w-24 bg-muted" />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.3">
        <path d="M12 2C8 6 6 10 8 15C9.5 18.5 12 20 12 22C12 20 14.5 18.5 16 15C18 10 16 6 12 2Z" />
        <path d="M12 6V19" />
      </svg>
      <span className="h-px w-14 md:w-24 bg-muted" />
    </div>
  )
}
