import { Blob, FeatherDoodle } from '@/components/public/decorative'
import { ImgPlaceholder } from '@/components/public/img-placeholder'

export function AboutMe() {
  return (
    <section className="relative w-full overflow-hidden bg-background py-16 md:py-24">
      <Blob className="absolute top-10 right-0 h-64 w-64 animate-[floaty_14s_ease-in-out_infinite_-4s] text-muted opacity-10" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <div className="relative">
          <ImgPlaceholder label="Foto de perfil / taller" className="h-80 w-full rounded-3xl shadow-xl md:h-96" />
          <FeatherDoodle className="absolute -bottom-6 -right-6 hidden h-20 w-14 text-muted md:block" />
        </div>

        <div>
          <p className="font-script mb-1 text-2xl text-muted">Sobre mí</p>
          <h2 className="mb-5 font-heading text-3xl font-semibold text-foreground md:text-4xl">Hola, soy Daniela</h2>
          <p className="mb-4 text-base leading-relaxed text-foreground">
            Soy Daniela, y este emprendimiento nace de mi pasión por descubrir historias increíbles. Siempre fui de
            sumergirme en el terror, los thrillers, la ficción contemporánea y el manga...
          </p>
          <p className="mb-6 text-base leading-relaxed text-foreground/75">
            Este es un proyecto que armo con las manos y con calma, pensando cada kit como si fuera un regalo para
            una amiga lectora.
          </p>
          <p className="font-script text-2xl text-muted">— Daniela, fundadora de Bookmist</p>
        </div>
      </div>
    </section>
  )
}
