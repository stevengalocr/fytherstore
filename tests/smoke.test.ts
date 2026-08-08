import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs TypeScript tests', () => expect(true).toBe(true))
})

describe('V0.2 foundation', () => {
  const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

  it('defines the Neon Door color tokens', () => {
    expect(globalsCss).toContain('--color-night: #050608')
    expect(globalsCss).toContain('--color-cyan: #6eeff2')
    expect(globalsCss).toContain('--color-pink: #f06ccb')
    expect(globalsCss).toContain('--color-ice: #eafbfb')
    expect(globalsCss).toContain('--color-mist: #a8b4b8')
  })

  it('removes the retired Volt accent', () => {
    expect(globalsCss).not.toMatch(/#b8ff3d/i)
  })
})
