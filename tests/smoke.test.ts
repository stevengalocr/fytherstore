import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs TypeScript tests', () => expect(true).toBe(true))
})

describe('V0.2 foundation', () => {
  const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')
  const rootCss = globalsCss.match(/^:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  const reducedMotionCss = globalsCss.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}\s*$/)?.[1] ?? ''

  it('defines the Neon Door color tokens in :root', () => {
    expect(rootCss).toContain('--color-night: #050608')
    expect(rootCss).toContain('--color-cyan: #6eeff2')
    expect(rootCss).toContain('--color-pink: #f06ccb')
    expect(rootCss).toContain('--color-ice: #eafbfb')
    expect(rootCss).toContain('--color-mist: #a8b4b8')
  })

  it('removes the retired V0.1 palette', () => {
    expect(globalsCss).not.toMatch(/#b8ff3d/i)
    expect(globalsCss).not.toMatch(/--(?:volt|bone|obsidian)\s*:/i)
  })

  it('shows cyan focus treatment around catalog controls', () => {
    expect(globalsCss).toMatch(/\.search-control:focus-within,\s*\.sort-control:focus-within\s*\{[^}]*border-color:\s*var\(--color-cyan\)[^}]*box-shadow:\s*0 0 0 1px var\(--color-cyan\)/)
  })

  it('selectively reduces spatial motion while preserving brief feedback', () => {
    expect(reducedMotionCss).not.toBe('')
    expect(reducedMotionCss).not.toMatch(/\*,\s*\*::before,\s*\*::after/)
    expect(reducedMotionCss).not.toContain('0.01ms')
    expect(reducedMotionCss).toMatch(/\.motion-track > div,[\s\S]*\.spinner,[\s\S]*\.catalog-loading span\s*\{[^}]*animation:\s*none !important/)
    expect(reducedMotionCss).toMatch(/transition-property:\s*background-color, border-color, color, opacity;/)
    expect(reducedMotionCss).toMatch(/transition-duration:\s*120ms;/)
  })
})
