const BENEFITS = [
  { text: '3 cuotas sin interés +$75.000', emoji: '💳' },
  { text: 'Envíos a todo el país', emoji: '📦' },
  { text: '10% OFF transferencia', emoji: '💸' },
]

export function BenefitsBar() {
  return (
    <section className="w-full bg-background py-8 md:py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-4 md:px-10">
        {BENEFITS.map((b, i) => (
          <div
            key={b.text}
            className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2 text-center md:gap-2 md:px-4 ${
              i !== 0 ? 'border-l border-muted' : ''
            }`}
          >
            <span className="text-lg md:text-2xl">{b.emoji}</span>
            <p className="text-xs font-bold leading-tight text-foreground md:text-sm">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
