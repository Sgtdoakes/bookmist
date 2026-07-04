import { Quote, Star } from 'lucide-react'

// Testimonios estáticos por ahora: todavía no hay panel para gestionarlos
// (llega con el CMS de la Fase 5), así que no tiene sentido crear una tabla.
const REVIEWS = [
  {
    name: 'Martina R.',
    text: 'Abrí la caja y sentí que me abrazaban. Cada detalle tiene alma, se nota que está pensado con cariño.',
  },
  {
    name: 'Lucía G.',
    text: 'El marcapáginas de plumas es precioso, y el libro que eligieron para mí fue exactamente lo que necesitaba leer.',
  },
  {
    name: 'Sofía P.',
    text: 'Se nota el cuidado en cada textura. Mi rincón de lectura ahora es muchísimo más lindo gracias a Bookmist.',
  },
]

export function Reviews() {
  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-12 text-center">
          <p className="font-script mb-1 text-2xl text-muted">Lo que dicen nuestras lectoras</p>
          <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">Reseñas</h2>
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <div key={r.name} className="relative rounded-2xl bg-card p-7 shadow-md">
              <Quote size={26} className="mb-3 text-muted" />
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-card-foreground">{r.text}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <p className="text-sm font-bold text-primary">{r.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
