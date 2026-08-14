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
})
