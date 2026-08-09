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

describe('Task 5 flagship home styling', () => {
  const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')
  const reducedMotionCss = globalsCss.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}\s*$/)?.[1] ?? ''

  it('removes every retired home styling system while preserving shared commerce selectors', () => {
    for (const retiredSelector of [
      'category-section',
      'category-rail',
      'category-link',
      'product-section',
      'product-grid',
      'trust-chips',
      'final-glow',
    ]) {
      expect(globalsCss).not.toMatch(new RegExp(`\\.${retiredSelector}(?:\\b|[-_])`))
    }

    expect(globalsCss).toMatch(/\.text-link\s*\{/)
    expect(globalsCss).toMatch(/\.product-card\s*\{/)
    expect(globalsCss).toMatch(/\.catalog-grid\s*\{/)
  })

  it('builds two stable photographic collection worlds with restrained accents', () => {
    expect(globalsCss).toMatch(/\.collection-worlds\s*\{[^}]*padding-(?:block|top):/)
    expect(globalsCss).toMatch(/\.collection-world-title\s*\{[^}]*font-size:\s*clamp\([^;]+\)/)
    expect(globalsCss).toMatch(/\.collection-world-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
    expect(globalsCss).toMatch(/\.collection-world-panel\s*\{[^}]*min-width:\s*0;[^}]*min-height:\s*44px/)
    expect(globalsCss).toMatch(/\.collection-world-media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5;[^}]*overflow:\s*hidden;[^}]*border-radius:\s*(?:[0-8](?:px)?|var\([^)]*\))/)
    expect(globalsCss).toMatch(/\.collection-world-panel:first-child\s*\{[^}]*--world-accent:\s*var\(--color-cyan\)/)
    expect(globalsCss).toMatch(/\.collection-world-panel:last-child\s*\{[^}]*--world-accent:\s*var\(--color-pink\)/)
    expect(globalsCss).toMatch(/\.collection-world-copy\s*\{[^}]*min-height:\s*(?:6[4-9]|7[0-2])px/)
    expect(globalsCss).toMatch(/\.collection-world-panel\[data-reveal\]:not\(\[data-reveal='on'\]\)\s*\{[^}]*opacity:\s*0;[^}]*clip-path:/)
    expect(globalsCss).toMatch(/\.collection-world-panel:nth-child\(2\)\[data-reveal\]:not\(\[data-reveal='on'\]\)\s*\{[^}]*transition-delay:\s*90ms/)
    expect(globalsCss).not.toMatch(/\.collection-world-panel:nth-child\(2\)\[data-reveal\]\s*\{[^}]*transition-delay:\s*90ms/)
  })

  it('gives collection sections stable responsive product grids and truthful empty bands', () => {
    expect(globalsCss).toMatch(/\.collection-section\s*\{[^}]*scroll-margin-top:\s*[^;]+;[^}]*padding-block:/)
    expect(globalsCss).toMatch(/\.collection-section-intro\s*\{[^}]*display:\s*grid/)
    expect(globalsCss).toMatch(/\.collection-product-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
    expect(globalsCss).toMatch(/\.collection-empty\s*\{[^}]*width:\s*100%;[^}]*border-(?:block|top):/)
    expect(globalsCss).toMatch(/\.collection-section-ropa\s*\{[^}]*--collection-accent:\s*var\(--color-cyan\)/)
    expect(globalsCss).toMatch(/\.collection-section-accesorios\s*\{[^}]*--collection-accent:\s*var\(--color-pink\)/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*1024px\)[\s\S]*?\.collection-product-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*767px\)[\s\S]*?\.collection-world-grid\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(globalsCss).toMatch(/@media \(width:\s*768px\)[\s\S]*?\.collection-world-grid\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*?\.collection-product-grid\s*\{[^}]*grid-template-columns:\s*1fr/)
  })

  it('lets the service ribbon wrap and grow without clipping its centered separators', () => {
    const railCss = globalsCss.match(/\.current-rail\s*\{([^}]*)\}/)?.[1] ?? ''
    const copyCss = globalsCss.match(/\.current-rail p\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(railCss).not.toMatch(/overflow(?:-[xy])?:\s*hidden/)
    expect(copyCss).not.toMatch(/overflow(?:-[xy])?:\s*hidden/)
    expect(copyCss).toMatch(/white-space:\s*normal/)
    expect(copyCss).toMatch(/text-align:\s*center/)
    expect(globalsCss).toMatch(/\.current-rail p span\s*\{[^}]*padding-inline:[^}]*color:\s*var\(--color-pink\)/)
  })

  it('keeps editorial media restrained and presents a centered one-column FAQ', () => {
    expect(globalsCss).toMatch(/\.editorial-story-media\s*\{[^}]*border-radius:\s*8px/)
    expect(globalsCss).toMatch(/\.trust-faq-layout\s*\{[^}]*display:\s*block/)
    expect(globalsCss).toMatch(/\.trust-faq-heading\s*\{[^}]*text-align:\s*center/)
    expect(globalsCss).toMatch(/\.trust-faq-list\s*\{[^}]*width:\s*min\(100%,\s*900px\);[^}]*margin-inline:\s*auto;[^}]*display:\s*grid/)
    expect(globalsCss).toMatch(/\.trust-faq-list details\s*\{[^}]*background:\s*var\(--color-night-raised\);[^}]*border-radius:\s*8px/)
    expect(globalsCss).toMatch(/\.trust-faq-list summary\s*\{[^}]*min-height:\s*(?:6[4-9]|7[0-2])px/)
    expect(globalsCss).toMatch(/\.trust-faq-list details\[open\] summary svg\s*\{[^}]*transform:\s*rotate\(180deg\)/)
    expect(globalsCss).toMatch(/\.trust-faq-list details\[open\] \.trust-faq-answer\s*\{[^}]*animation:\s*faq-answer-in\s+(?:1[89]\d|2\d\d|300)ms/)
  })

  it('removes spatial collection and FAQ motion under reduced motion', () => {
    expect(reducedMotionCss).toMatch(/\.collection-world-panel\[data-reveal\],[\s\S]*\.collection-world-panel\[data-reveal\]:not\(\[data-reveal='on'\]\)\s*\{[^}]*clip-path:\s*none !important;[^}]*transform:\s*none !important/)
    expect(reducedMotionCss).toMatch(/\.collection-world-media img,[\s\S]*\.collection-world-copy svg,[\s\S]*\.trust-faq-list summary svg,[\s\S]*\.trust-faq-answer\s*\{[^}]*transform:\s*none !important;[^}]*animation:\s*none !important/)
    expect(reducedMotionCss).toMatch(/\.collection-world-panel,[\s\S]*\.trust-faq-list details\s*\{[^}]*transition-property:\s*background-color, border-color, color, opacity;[^}]*transition-duration:\s*120ms/)
  })
})

describe('Task 5 deterministic browser matrix', () => {
  const playwrightConfig = readFileSync(resolve(process.cwd(), 'playwright.config.ts'), 'utf8')
  const storeE2e = readFileSync(resolve(process.cwd(), 'e2e/store.spec.ts'), 'utf8')

  it('defines configured responsive projects and a separate unconfigured desktop project', () => {
    for (const projectName of ['desktop-configured', 'tablet-configured', 'mobile-configured', 'desktop-unconfigured']) {
      expect(playwrightConfig).toContain(`name: '${projectName}'`)
    }
    expect(playwrightConfig.match(/webServer:\s*\[/)).not.toBeNull()
    expect(playwrightConfig).toContain('http://127.0.0.1:3197')
    expect(playwrightConfig).toContain('http://127.0.0.1:3198')
    expect(playwrightConfig).toMatch(/NEXT_PUBLIC_SUPABASE_URL:\s*''/)
    expect(playwrightConfig).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY:\s*''/)
    expect(playwrightConfig).toMatch(/NEXT_PUBLIC_BUSINESS_ID:\s*''/)
    expect(playwrightConfig).toMatch(/SUPABASE_SERVICE_ROLE_KEY:\s*''/)
    expect(playwrightConfig).toMatch(/FYTHER_E2E_COMMERCE_FIXTURE:\s*'live'/)
    expect(playwrightConfig).toMatch(/FYTHER_E2E_COMMERCE_FIXTURE:\s*''/)
    expect(playwrightConfig).not.toContain('-live')
    expect(playwrightConfig).toMatch(/workers:\s*1/)
    expect(playwrightConfig).toMatch(/retries:\s*0/)
  })

  it('derives browser expectations from project mode instead of rendered locator counts', () => {
    expect(storeE2e).toContain("startsWith('desktop')")
    expect(storeE2e).toContain("endsWith('-configured')")
    expect(storeE2e).toContain("endsWith('-unconfigured')")
    expect(storeE2e).toContain('projectMode')
    expect(storeE2e).not.toContain("endsWith('-live')")
    expect(storeE2e).not.toMatch(/if\s*\(await [^\n]*\.count\(\)/)
  })
})
