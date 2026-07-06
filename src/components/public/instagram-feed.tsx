import { ImgPlaceholder } from '@/components/public/img-placeholder'
import { InstagramIcon } from '@/components/public/decorative'
import type { InstagramConfig } from '@/lib/secciones'

// Grilla estática (no la API real de Instagram todavía: eso es su propio
// trabajo de OAuth/token-refresh, sin relación con "landing + catálogo real"
// que es el objetivo de esta fase).
export function InstagramFeed({ titulo }: InstagramConfig) {
  return (
    <section className="w-full border-t border-foreground/10 bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <InstagramIcon className="h-[22px] w-[22px] text-muted" />
          <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">{titulo}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="aspect-square cursor-pointer overflow-hidden rounded-xl transition-[transform,opacity] duration-400 hover:scale-[1.03]"
            >
              <ImgPlaceholder label="Post Instagram" className="h-full w-full" iconSize={20} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
