import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('storefront metadata source', () => {
  const layoutSource = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')
  const truthfulDescription = 'Accesorios originales y nuevas selecciones en camino para acompañar tu movimiento.'

  it('uses the same truthful description for default and OpenGraph metadata', () => {
    expect(layoutSource.match(new RegExp(truthfulDescription, 'g'))).toHaveLength(2)
    expect(layoutSource).not.toContain('Ropa activa seleccionada')
  })

  it('uses the desktop editorial poster for OpenGraph metadata', () => {
    expect(layoutSource).toContain("url: '/editorial/hero-poster-desktop.webp'")
    expect(layoutSource).toContain('width: 2400')
    expect(layoutSource).toContain('height: 1350')
    expect(layoutSource).toContain("alt: 'Fyther Store, movimiento y ropa deportiva femenina'")
  })
})
