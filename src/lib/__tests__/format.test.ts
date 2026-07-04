import { describe, expect, it } from 'vitest'
import { formatARS } from '@/lib/format'

describe('formatARS', () => {
  it('formatea con separador de miles y sin decimales', () => {
    const out = formatARS(18900)
    expect(out).toContain('18.900')
    expect(out).toContain('$')
    expect(out).not.toContain(',') // sin centavos
  })

  it('acepta strings numéricos', () => {
    expect(formatARS('24900')).toContain('24.900')
  })

  it('devuelve $0 para null/undefined', () => {
    expect(formatARS(null)).toContain('0')
    expect(formatARS(undefined)).toContain('0')
  })

  it('devuelve $0 para valores no numéricos', () => {
    expect(formatARS('no-es-un-numero')).toContain('0')
  })
})
