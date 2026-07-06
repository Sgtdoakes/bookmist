import { Quote, Star } from 'lucide-react'
import type { ResenasConfig } from '@/lib/secciones'

export function Reviews({ eyebrow, titulo, items }: ResenasConfig) {
  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-12 text-center">
          <p className="font-script mb-1 text-2xl text-muted">{eyebrow}</p>
          <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">{titulo}</h2>
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {items.map((r) => (
            <div key={r.nombre} className="relative rounded-2xl bg-card p-7 shadow-md">
              <Quote size={26} className="mb-3 text-muted" />
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-card-foreground">{r.texto}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <p className="text-sm font-bold text-primary">{r.nombre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
