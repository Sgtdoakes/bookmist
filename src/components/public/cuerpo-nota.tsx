import Link from 'next/link'
import { parsearCuerpo, type Inline } from '@/lib/blog-cuerpo'

// Dibuja el cuerpo de una nota del blog. Sin 'use client' y sin nada del
// servidor: lo usan la página pública y la vista previa del panel, así lo
// que Dani ve mientras escribe es exactamente lo que se publica.
function Inlines({ partes }: { partes: Inline[] }) {
  return partes.map((p, i) => {
    if (p.tipo === 'negrita') {
      return (
        <strong key={i} className="font-bold text-foreground">
          {p.texto}
        </strong>
      )
    }
    if (p.tipo === 'link') {
      const clase =
        'font-semibold text-foreground underline decoration-muted decoration-2 underline-offset-4 transition-colors hover:text-muted'
      return p.externo ? (
        <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className={clase}>
          {p.texto}
        </a>
      ) : (
        <Link key={i} href={p.href} className={clase}>
          {p.texto}
        </Link>
      )
    }
    return <span key={i}>{p.texto}</span>
  })
}

export function CuerpoNota({ cuerpo }: { cuerpo: string }) {
  const bloques = parsearCuerpo(cuerpo)
  return (
    <div className="space-y-5 text-base leading-relaxed text-foreground/85 md:text-lg">
      {bloques.map((b, i) => {
        if (b.tipo === 'subtitulo') {
          return (
            <h2 key={i} className="pt-4 font-heading text-2xl font-semibold text-foreground md:text-3xl">
              <Inlines partes={b.contenido} />
            </h2>
          )
        }
        if (b.tipo === 'lista') {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-muted">
              {b.items.map((item, j) => (
                <li key={j}>
                  <Inlines partes={item} />
                </li>
              ))}
            </ul>
          )
        }
        // whitespace-pre-line: un salto simple dentro de un párrafo se respeta
        // (mismo criterio que la descripción de producto).
        return (
          <p key={i} className="whitespace-pre-line">
            <Inlines partes={b.contenido} />
          </p>
        )
      })}
    </div>
  )
}
