import { ChevronLeft, LayoutTemplate, Loader2 } from 'lucide-react'

// Sin esto, Next.js espera a que TODA la página nueva (secciones + preview
// resuelto, Fase 8c: hasta 6 bloques) esté lista en el servidor antes de
// mostrar cualquier cosa — el cambio de pestaña se sentía "trabado" en vez
// de mostrar que está cargando. Imita el alto/padding de la barra real
// (page-builder.tsx) para que no salte el layout al terminar de cargar.
export default function CargandoPagina() {
  return (
    <div className="flex h-[calc(100vh-65px)] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          Panel
        </span>
        <div className="flex items-center gap-1.5">
          <LayoutTemplate className="h-5 w-5 shrink-0 text-primary" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted/40" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted/40" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted/40" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    </div>
  )
}
