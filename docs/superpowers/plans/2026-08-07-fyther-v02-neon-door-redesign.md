# Fyther Store V0.2 Neon Door Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor every Fyther Store customer route into the approved Neon Door experience while preserving BilBildin as the exclusive live commerce source.

**Architecture:** Keep `lib/commerce/*`, server-only credentials, tenant filters, cart state and checkout actions behaviorally unchanged. Build the new experience from shared brand primitives, focused home-scene components and route-specific operational layouts, using CSS and the existing `IntersectionObserver` initializer for Fyther Current motion.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS, `next/image`, `next/font`, Lucide React, Vitest, Testing Library and Playwright.

---

## Working Rules

- Work only in `C:\Users\steve\OneDrive\Desktop\FytherStore\.worktrees\fyther-v1-impl`.
- Preserve all existing user changes and do not edit `lib/commerce/*` unless a failing behavioral test proves a real integration defect.
- Do not add demo products, prices, variants, inventory, orders or fallback payment methods.
- Do not copy the unrelated `.env.local` from the parent repository.
- Use the approved specification at `docs/superpowers/specs/2026-08-07-fyther-v02-neon-door-redesign-design.md` as the acceptance source.
- Run the narrow test first, then the full relevant suite, then commit each task.

## File Structure

### New Files

- `components/BrandMark.tsx`: renders the official Fyther logo consistently without recreating the wordmark.
- `components/site/WhyFyther.tsx`: the three verified value statements and connected mobile composition.
- `components/site/EditorialStory.tsx`: the large editorial movement scene.
- `components/site/TrustFaq.tsx`: trust chips and accessible FAQ.
- `components/site/FinalGlow.tsx`: final brand scene and collection action.
- `tests/components/brand-mark.test.tsx`: official logo contract.
- `tests/components/catalog-client.test.tsx`: filtering and recovery behavior.
- `tests/components/product-detail.test.tsx`: variants, quantity and add-to-cart feedback.
- `tests/components/order-presentation.test.tsx`: confirmation and tracking presentation.
- `tests/components/policy-page.test.tsx`: quiet policy layout semantics.

### Modified Files

- `public/logo1.png`, `public/logo2.png`, `public/modelo1.png`, `public/modelo2.png`, `public/ropa.png`: add supplied originals to the tracked worktree.
- `app/layout.tsx`: fonts, metadata, direction comment, reveal initializer and global shell.
- `app/globals.css`: replace V0.1 styles with V0.2 tokens, layouts, states, motion and responsive rules.
- `app/page.tsx`: compose the eight home scenes around live commerce state.
- `components/Header.tsx`, `components/Footer.tsx`: subtle global navigation and Final Glow-compatible footer.
- `components/RevealInit.tsx`: one-time reveals and current-line progress with reduced-motion handling.
- `components/site/HeroMedia.tsx`, `MotionTrack.tsx`, `CategoryRail.tsx`: Neon Door hero, calm current and real category rail.
- `components/site/EditorialSections.tsx`: remove after its responsibilities are moved to focused scene components.
- `components/commerce/CommerceState.tsx`, `ProductGrid.tsx`, `components/ProductCard.tsx`: honest states and editorial live-product presentation.
- `app/catalogo/*`, `app/catalogo/[slug]/*`: catalog and product layouts.
- `app/carrito/page.tsx`, `app/checkout/*`: calm purchase workflow and accessible validation.
- `components/commerce/OrderPresentation.tsx`, `components/site/PolicyPage.tsx`: order and policy surfaces.
- `app/error.tsx`, `app/not-found.tsx`: friendly recovery.
- Existing tests and `e2e/store.spec.ts`: approved copy, interactions, no-simulation assertions and visual checks.
- `DESIGN.md`: replace the retired V0.1 system with the implemented V0.2 system.

## Task 1: Add Official Assets And Brand Primitive

**Files:**
- Create: `components/BrandMark.tsx`
- Create: `tests/components/brand-mark.test.tsx`
- Add: `public/logo1.png`
- Add: `public/logo2.png`
- Add: `public/modelo1.png`
- Add: `public/modelo2.png`
- Add: `public/ropa.png`

- [ ] **Step 1: Write the failing BrandMark test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandMark from '@/components/BrandMark'

describe('BrandMark', () => {
  it('uses the supplied Fyther logo instead of a text recreation', () => {
    render(<BrandMark />)
    const logo = screen.getByRole('img', { name: 'Fyther Store' })
    expect(logo.getAttribute('src')).toContain('logo1.png')
    expect(screen.queryByText(/^FYTHER$/)).not.toBeInTheDocument()
  })

  it('can be decorative when its parent already names the destination', () => {
    const { container } = render(<BrandMark decorative />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })
})
```

- [ ] **Step 2: Run the test and verify the component is missing**

Run: `npm test -- tests/components/brand-mark.test.tsx`

Expected: FAIL because `@/components/BrandMark` does not exist.

- [ ] **Step 3: Add the official BrandMark component**

```tsx
import Image from 'next/image'

export default function BrandMark({ decorative = false, priority = false, variant = 'primary' }: {
  decorative?: boolean
  priority?: boolean
  variant?: 'primary' | 'alternate'
}) {
  return (
    <span className="brand-mark" data-variant={variant}>
      <Image
        src={variant === 'primary' ? '/logo1.png' : '/logo2.png'}
        alt={decorative ? '' : 'Fyther Store'}
        width={220}
        height={220}
        priority={priority}
        sizes="(max-width: 767px) 88px, 112px"
      />
    </span>
  )
}
```

- [ ] **Step 4: Copy the supplied originals without modifying them**

Run:

```powershell
Copy-Item -LiteralPath `
  'C:\Users\steve\OneDrive\Desktop\FytherStore\public\logo1.png', `
  'C:\Users\steve\OneDrive\Desktop\FytherStore\public\logo2.png', `
  'C:\Users\steve\OneDrive\Desktop\FytherStore\public\modelo1.png', `
  'C:\Users\steve\OneDrive\Desktop\FytherStore\public\modelo2.png', `
  'C:\Users\steve\OneDrive\Desktop\FytherStore\public\ropa.png' `
  -Destination 'C:\Users\steve\OneDrive\Desktop\FytherStore\.worktrees\fyther-v1-impl\public'
```

Expected: five new untracked assets in `git status --short`; existing `home.jpeg` and `video-presentacion.mp4` remain unchanged.

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- tests/components/brand-mark.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 6: Commit the asset contract**

```bash
git add components/BrandMark.tsx tests/components/brand-mark.test.tsx public/logo1.png public/logo2.png public/modelo1.png public/modelo2.png public/ropa.png
git commit -m "feat: add Fyther brand assets"
```

## Task 2: Replace The V0.1 Foundation

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `DESIGN.md`
- Modify: `tests/smoke.test.ts`

- [ ] **Step 1: Add a failing token regression test**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Fyther V0.2 foundation', () => {
  const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

  it('defines the approved Neon Door colors', () => {
    expect(css).toContain('--color-night: #050608')
    expect(css).toContain('--color-cyan: #6eeff2')
    expect(css).toContain('--color-pink: #f06ccb')
    expect(css).toContain('--color-ice: #eafbfb')
    expect(css).toContain('--color-mist: #a8b4b8')
  })

  it('retires the V0.1 green accent', () => {
    expect(css.toLowerCase()).not.toContain('#b8ff3d')
  })
})
```

- [ ] **Step 2: Run the regression test and verify it fails**

Run: `npm test -- tests/smoke.test.ts`

Expected: FAIL because the V0.2 variables are absent and the retired accent is present.

- [ ] **Step 3: Update fonts, metadata and global initializer**

Use this layout contract:

```tsx
import type { Metadata } from 'next'
import { Barlow_Semi_Condensed, Manrope } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RevealInit from '@/components/RevealInit'
import './globals.css'

const display = Barlow_Semi_Condensed({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' })
const body = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const siteUrl = configuredSiteUrl && URL.canParse(configuredSiteUrl) ? configuredSiteUrl : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Fyther Store | Muévete a tu manera', template: '%s | Fyther Store' },
  description: 'Ropa activa seleccionada para moverte, compartir y sentirte bien.',
  openGraph: {
    title: 'Fyther Store | Muévete a tu manera',
    description: 'Ropa activa seleccionada para moverte, compartir y sentirte bien.',
    locale: 'es_CR',
    type: 'website',
    images: [{ url: '/home.jpeg', width: 1024, height: 572, alt: 'Boutique nocturna de Fyther Store' }],
  },
}
```

Keep the existing `CartProvider`, `Header`, `main` and `Footer` structure. Mount `<RevealInit />` once inside the provider and replace the hidden direction comment with a V0.2 Neon Door summary.

- [ ] **Step 4: Replace global tokens and base styles**

Start `app/globals.css` with this exact contract, then restyle existing selectors using these variables:

```css
:root {
  --color-night: #050608;
  --color-night-raised: #0b0d10;
  --color-cyan: #6eeff2;
  --color-pink: #f06ccb;
  --color-ice: #eafbfb;
  --color-mist: #a8b4b8;
  --color-stone: #b69c79;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --container: 1240px;
}

* { box-sizing: border-box; }
html { color-scheme: dark; scroll-behavior: smooth; }
body { margin: 0; background: var(--color-night); color: var(--color-ice); font-family: var(--font-body), sans-serif; }
button, input, select, textarea { font: inherit; }
a { color: inherit; }
.container { width: min(calc(100% - 32px), var(--container)); margin-inline: auto; }
.display { font-family: var(--font-display), sans-serif; letter-spacing: 0; }
:focus-visible { outline: 2px solid var(--color-cyan); outline-offset: 3px; }
```

Remove V0.1 variables, pale page surfaces, the green accent and text wordmark styling. Preserve `sr-only`, functional layout selectors and form semantics while moving all surfaces onto the approved palette.

- [ ] **Step 5: Rewrite the design system documentation**

Replace `DESIGN.md` with headings for `North Star`, `Audience`, `Palette`, `Typography`, `Shape`, `Motion`, `Commerce Truth`, `Responsive Rules` and `Quality Gates`. Copy exact values and rules from the approved V0.2 specification; explicitly state that V0.1 is retired.

- [ ] **Step 6: Run checks and commit**

Run: `npm test -- tests/smoke.test.ts && npm run typecheck`

Expected: token tests PASS and TypeScript exits 0.

```bash
git add app/layout.tsx app/globals.css DESIGN.md tests/smoke.test.ts
git commit -m "refactor: establish Fyther V0.2 foundation"
```

## Task 3: Build The Subtle Header And Global Footer

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`
- Modify: `tests/components/header.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Expand the failing header behavior test**

Add assertions that the official logo is present, links use the warm navigation labels, Escape closes the mobile menu and the cart remains accessible:

```tsx
const user = userEvent.setup()
render(<Header />)
const homeLink = screen.getByRole('link', { name: 'Fyther Store, inicio' })
expect(homeLink.querySelector('img')).toHaveAttribute('alt', '')
expect(screen.getByRole('link', { name: 'Colección' })).toBeInTheDocument()
expect(screen.getByRole('link', { name: 'Nosotras' })).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true')
await user.keyboard('{Escape}')
expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false')
expect(screen.getByRole('link', { name: /carrito, 2 productos/i })).toBeInTheDocument()
```

- [ ] **Step 2: Run the header test and verify the new assertions fail**

Run: `npm test -- tests/components/header.test.tsx`

Expected: FAIL on official logo, `Nosotras` and Escape behavior.

- [ ] **Step 3: Implement the accessible header behavior**

In `Header.tsx`:

- Import and render `<BrandMark decorative priority />` inside the home link.
- Use `Descubrir` -> `/#descubrir`, `Colección` -> `/catalogo`, and `Nosotras` -> `/#fyther`.
- Keep Lucide `Menu`, `X` and `ShoppingBag` icons.
- Add a `useEffect` that closes on Escape and toggles `document.body.dataset.menuOpen` while open.
- Add `aria-controls="primary-navigation"` to the menu button and `id="primary-navigation"` to the nav.
- Keep the existing route-click close behavior and cart count label.

Use this effect exactly:

```tsx
useEffect(() => {
  if (!open) {
    delete document.body.dataset.menuOpen
    return
  }
  document.body.dataset.menuOpen = 'true'
  const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
  window.addEventListener('keydown', close)
  return () => {
    delete document.body.dataset.menuOpen
    window.removeEventListener('keydown', close)
  }
}, [open])
```

- [ ] **Step 4: Update the footer content**

Render `<BrandMark decorative variant="alternate" />`, the line `Muévete a tu manera.`, collection/cart links, shipping/change/legal links and existing WhatsApp/email contacts. Keep the current dynamic year and Costa Rica label.

- [ ] **Step 5: Add the capsule and responsive navigation CSS**

Implement `.site-header` as fixed, centered and pointer-transparent around `.header-inner`; style `.header-inner` as the 52px translucent Night capsule. Ensure `.icon-button` and `.icon-link` are 44px square, mobile navigation fills beneath the capsule without overlapping content, and `body[data-menu-open] { overflow: hidden; }` applies only while open.

```css
.site-header { position: fixed; z-index: 50; top: 16px; left: 0; right: 0; pointer-events: none; }
.header-inner { width: min(calc(100% - 24px), 1240px); min-height: 52px; margin-inline: auto; padding-inline: 12px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border: 1px solid rgba(234, 251, 251, 0.16); border-radius: 999px; background: rgba(5, 6, 8, 0.78); backdrop-filter: blur(16px); pointer-events: auto; }
.icon-button, .icon-link { width: 44px; height: 44px; display: inline-grid; place-items: center; }
body[data-menu-open] { overflow: hidden; }
@media (max-width: 767px) { .header-inner { grid-template-columns: 44px 1fr 44px; } .site-nav { position: fixed; inset: 76px 12px auto; } }
```

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- tests/components/header.test.tsx tests/components/brand-mark.test.tsx`

Expected: all tests PASS.

```bash
git add components/Header.tsx components/Footer.tsx tests/components/header.test.tsx app/globals.css
git commit -m "feat: add subtle Fyther navigation"
```

## Task 4: Build Neon Door And Fyther Current

**Files:**
- Modify: `components/site/HeroMedia.tsx`
- Modify: `components/site/MotionTrack.tsx`
- Modify: `components/RevealInit.tsx`
- Modify: `tests/components/hero-media.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the hero test with the approved contract**

```tsx
render(<HeroMedia />)
expect(screen.getByRole('heading', { name: 'Muévete a tu manera.' })).toBeInTheDocument()
expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
expect(screen.getByRole('link', { name: 'Conocer Fyther' })).toHaveAttribute('href', '/#fyther')
expect(screen.getByRole('img', { name: /boutique nocturna de fyther/i })).toBeInTheDocument()
expect(screen.queryByText(/move different/i)).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the hero test and verify it fails on retired copy**

Run: `npm test -- tests/components/hero-media.test.tsx`

Expected: FAIL because the current H1 is `MOVE DIFFERENT.`.

- [ ] **Step 3: Implement the approved hero**

Keep the existing reduced-motion, data-saver and viewport video logic. Replace the JSX with:

```tsx
<section className="hero-section" aria-labelledby="hero-title" data-scene="hero">
  <div className="hero-media">
    <Image src="/home.jpeg" alt="Boutique nocturna de Fyther Store" fill priority sizes="100vw" className="hero-poster" />
    {playVideo && <video ref={videoRef} muted loop playsInline preload="metadata" poster="/home.jpeg" aria-hidden="true"><source src="/video-presentacion.mp4" type="video/mp4" /></video>}
  </div>
  <div className="hero-scrim" aria-hidden="true" />
  <div className="hero-content container" data-reveal>
    <p>PARA MOVERTE, COMPARTIR Y SENTIRTE BIEN</p>
    <h1 id="hero-title" className="display">Muévete a tu manera.</h1>
    <p className="hero-description">Una selección de ropa activa para entrenar, caminar o disfrutar el día con las personas que te impulsan.</p>
    <div className="hero-actions">
      <Link className="button button-primary" href="/catalogo">Ver la colección</Link>
      <Link className="button button-secondary" href="/#fyther">Conocer Fyther</Link>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Replace the marquee with a calm current rail**

`MotionTrack.tsx` renders one semantic line and one decorative progress element:

```tsx
export default function MotionTrack() {
  return (
    <section className="current-rail" aria-label="Moverse, sentirse bien, compartir, Fyther" data-current>
      <p>MOVERSE <span>·</span> SENTIRSE BIEN <span>·</span> COMPARTIR <span>·</span> FYTHER</p>
      <div className="current-line" aria-hidden="true"><span /></div>
    </section>
  )
}
```

- [ ] **Step 5: Extend RevealInit without adding a dependency**

Keep one-time `[data-reveal]` observation and use this complete effect to drive local current progress without a dependency:

```tsx
useEffect(() => {
  const reveals = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="on"])')]
  const currents = [...document.querySelectorAll<HTMLElement>('[data-current]')]
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced) {
    reveals.forEach((element) => element.setAttribute('data-reveal', 'on'))
    currents.forEach((element) => element.style.setProperty('--current-progress', '1'))
    return
  }

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.setAttribute('data-reveal', 'on')
      observer.unobserve(entry.target)
    }
  }), { threshold: 0.12 })
  reveals.forEach((element) => observer.observe(element))

  let frame = 0
  const updateCurrent = () => {
    frame = 0
    currents.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)))
      element.style.setProperty('--current-progress', progress.toFixed(3))
    })
  }
  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(updateCurrent)
  }
  updateCurrent()
  window.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate)
  return () => {
    observer.disconnect()
    if (frame) window.cancelAnimationFrame(frame)
    window.removeEventListener('scroll', requestUpdate)
    window.removeEventListener('resize', requestUpdate)
  }
}, [pathname])
```

- [ ] **Step 6: Add hero and current CSS**

Use `min-height: 96svh`, a stable full-bleed media layer, solid translucent scrims, left-aligned copy and a constrained bottom position that leaves the following current rail visible. Animate logo/copy only with transform and opacity. Current progress uses `transform: scaleX(var(--current-progress, 0))` and a pink endpoint; no infinite marquee.

```css
.hero-section { position: relative; min-height: 96svh; overflow: hidden; isolation: isolate; }
.hero-media, .hero-scrim { position: absolute; inset: 0; }
.hero-media img, .hero-media video { width: 100%; height: 100%; object-fit: cover; }
.hero-scrim { background: rgba(5, 6, 8, 0.38); box-shadow: inset 0 -280px 180px rgba(5, 6, 8, 0.94); }
.hero-content { position: relative; z-index: 1; min-height: 96svh; display: flex; flex-direction: column; justify-content: flex-end; gap: var(--space-4); padding-block: 140px 80px; }
.current-line > span { display: block; width: 100%; height: 2px; transform: scaleX(var(--current-progress, 0)); transform-origin: left; background: var(--color-cyan); transition: transform 120ms linear; }
@media (prefers-reduced-motion: reduce) { .current-line > span { transition-duration: 0.01ms; } }
```

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- tests/components/hero-media.test.tsx && npm run typecheck`

Expected: tests PASS and TypeScript exits 0.

```bash
git add components/site/HeroMedia.tsx components/site/MotionTrack.tsx components/RevealInit.tsx tests/components/hero-media.test.tsx app/globals.css
git commit -m "feat: build Neon Door hero motion"
```

## Task 5: Compose The Complete Home Story

**Files:**
- Create: `components/site/WhyFyther.tsx`
- Create: `components/site/EditorialStory.tsx`
- Create: `components/site/TrustFaq.tsx`
- Create: `components/site/FinalGlow.tsx`
- Modify: `components/site/CategoryRail.tsx`
- Modify: `components/commerce/ProductGrid.tsx`
- Modify: `components/commerce/CommerceState.tsx`
- Modify: `tests/components/commerce-state.test.tsx`
- Modify: `app/page.tsx`
- Delete: `components/site/EditorialSections.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update commerce-state tests with the approved messages**

```tsx
render(<CommerceState state="empty" />)
expect(screen.getByRole('heading', { name: 'La colección vuelve pronto.' })).toBeInTheDocument()
expect(screen.queryByRole('article')).not.toBeInTheDocument()

rerender(<CommerceState state="error" />)
expect(screen.getByRole('heading', { name: 'No pudimos cargar la colección.' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()

rerender(<CommerceState state="unconfigured" />)
expect(screen.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeInTheDocument()
expect(screen.queryByText(/key|endpoint|supabase|demo|simulaci/i)).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the test and verify old messages fail**

Run: `npm test -- tests/components/commerce-state.test.tsx`

Expected: FAIL on all three approved headings and retry button.

- [ ] **Step 3: Implement honest customer-safe states**

Make `CommerceState.tsx` a client component so error state can call `router.refresh()`. Empty uses `modelo2.png`, unconfigured uses the official mark, and error provides `Intentar de nuevo` plus `Volver al inicio`. Preserve `role="alert"` only for the error state.

- [ ] **Step 4: Create the four focused scene components**

Create the components with these complete content contracts:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import BrandMark from '@/components/BrandMark'

export function WhyFyther() {
  const values = ['Calidad seleccionada', 'Originalidad verificable', 'Lista para moverte']
  return <section id="fyther" className="why-fyther container" data-reveal><p className="section-label">POR QUÉ FYTHER</p><h2 className="display">Elegimos con intención.</h2><div>{values.map((value) => <p key={value}>{value}</p>)}</div></section>
}

export function EditorialStory() {
  return <section className="editorial-story container" data-reveal><div className="editorial-story-media"><Image src="/modelo1.png" alt="Mujer entrenando en un espacio de luz cyan y rosa" fill sizes="(max-width: 767px) 100vw, 88vw" /></div><div className="editorial-story-copy"><p className="section-label">A TU RITMO</p><h2 className="display">Sentirte bien también cuenta.</h2><p>Prendas para acompañar tu rutina sin dictarla.</p><Link href="/catalogo">Ver la colección</Link></div></section>
}

export function TrustFaq() {
  return <section id="preguntas" className="trust-faq container"><div className="trust-chips"><span>Envíos claros</span><span>Cambios con acompañamiento</span><span>Soporte cercano</span></div><div className="faq-list"><h2 className="display">Preguntas, sin vueltas.</h2><details><summary>¿De dónde viene la colección?</summary><p>Productos, variantes, precios y disponibilidad se publican desde BilBildin.</p></details><details><summary>¿Cómo consulto mi pedido?</summary><p>La confirmación incluye un enlace único para seguir tu pedido.</p></details><details><summary>¿Cómo funcionan envíos y cambios?</summary><p>Consulta nuestra información de envíos y cambios antes de comprar.</p></details></div></section>
}

export function FinalGlow() {
  return <section className="final-glow"><BrandMark variant="alternate" decorative /><h2 className="display">Lo que sigue, a tu manera.</h2><Link className="button button-primary" href="/catalogo">Ver la colección</Link></section>
}
```

`TrustFaq` must retain these factual answers: catalog data comes from BilBildin, availability reflects the connected store, order confirmation links to tracking, and shipping/change details live on `/envios-cambios`.

- [ ] **Step 5: Refactor real categories and live selection**

`CategoryRail` keeps returning `null` for no categories, uses the heading `Encuentra tu movimiento.` and horizontal snap links to `/catalogo?categoria=...`. `ProductGrid` uses the title `Una selección para ti.` by default and renders exactly the live products passed by `app/page.tsx`.

- [ ] **Step 6: Compose the eight scenes in app/page.tsx**

Use this order:

```tsx
<HeroMedia />
<MotionTrack />
{hasLiveProducts && <CategoryRail categories={categories} />}
{commerceMode === 'unconfigured' ? <CommerceState state="unconfigured" /> : failed ? <CommerceState state="error" /> : products.length === 0 ? <CommerceState state="empty" /> : <ProductGrid products={featured.length ? featured : products.slice(0, 3)} />}
<WhyFyther />
<EditorialStory />
<TrustFaq />
<FinalGlow />
```

Delete `EditorialSections.tsx` after all responsibilities move to the focused components.

- [ ] **Step 7: Style scenes without generic card grids**

Use horizontal snap media for categories, one large plus two secondary product tracks on desktop, vertical mobile flow, curved editorial media masks, an unframed value orbit and a clean FAQ band. Keep operational cards at 8px radius or less and reserve larger radii for media only.

```css
.category-rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, 30vw); gap: var(--space-4); overflow-x: auto; scroll-snap-type: x mandatory; }
.category-rail > a { min-height: 360px; scroll-snap-align: start; border-radius: 36px 8px 36px 8px; overflow: hidden; }
.product-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) repeat(2, minmax(0, 0.85fr)); gap: var(--space-4); }
.editorial-story-media { position: relative; min-height: min(78svh, 820px); border-radius: 44px 8px 44px 8px; overflow: hidden; }
.why-fyther > div { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-8); }
.faq-list details { border-bottom: 1px solid rgba(234, 251, 251, 0.14); }
@media (max-width: 767px) { .category-rail { grid-auto-columns: 82vw; } .product-grid, .why-fyther > div { grid-template-columns: 1fr; } }
```

- [ ] **Step 8: Run tests and commit**

Run: `npm test -- tests/components/commerce-state.test.tsx tests/components/product-card.test.tsx && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

```bash
git add app/page.tsx app/globals.css components/site components/commerce/CommerceState.tsx components/commerce/ProductGrid.tsx tests/components/commerce-state.test.tsx
git commit -m "feat: compose complete Fyther home story"
```

## Task 6: Refactor Live Product Cards And Catalog

**Files:**
- Modify: `components/ProductCard.tsx`
- Modify: `tests/components/product-card.test.tsx`
- Create: `tests/components/catalog-client.test.tsx`
- Modify: `app/catalogo/CatalogClient.tsx`
- Modify: `app/catalogo/page.tsx`
- Modify: `app/catalogo/loading.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add catalog interaction tests**

Create two mapped `CommerceProduct` fixtures with distinct names, categories and prices. Assert:

```tsx
render(<CatalogClient products={[legging, top]} initialCategory="Todos" />)
await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'legging')
expect(screen.getByText(legging.name)).toBeInTheDocument()
expect(screen.queryByText(top.name)).not.toBeInTheDocument()
await user.clear(screen.getByRole('textbox', { name: 'Buscar productos' }))
await user.click(screen.getByRole('button', { name: top.category! }))
expect(screen.getByText(top.name)).toBeInTheDocument()
expect(screen.queryByText(legging.name)).not.toBeInTheDocument()
```

Also assert that a no-match query renders `No encontramos esa combinación.` and a `Limpiar filtros` button restores all products.

- [ ] **Step 2: Run the catalog test and verify recovery is missing**

Run: `npm test -- tests/components/catalog-client.test.tsx`

Expected: FAIL because the test file and clear-filters behavior do not exist.

- [ ] **Step 3: Implement catalog recovery and warm copy**

- Change the catalog H1 to `Encuentra algo para ti.` and body to `Ropa activa para entrenar, caminar y compartir tu ritmo.`
- Keep categories derived only from the `products` prop.
- Add `clearFilters()` that sets category to `Todos`, query to `''` and sort to `featured`.
- Render `No encontramos esa combinación.` with a `Limpiar filtros` button when `visible` is empty.
- Keep the result count in `aria-live="polite"`.

```tsx
const clearFilters = () => {
  setCategory('Todos')
  setQuery('')
  setSort('featured')
}

{visible.length > 0 ? (
  <div className="catalog-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div>
) : (
  <div className="catalog-no-results"><h2 className="display">No encontramos esa combinación.</h2><p>Prueba otra categoría o limpia los filtros.</p><button type="button" className="button button-secondary" onClick={clearFilters}>Limpiar filtros</button></div>
)}
```

- [ ] **Step 4: Refine ProductCard without changing its data contract**

Keep image, category, name, `formatMoney`, sold-out handling and route unchanged. Use a stable media aspect ratio, move the action into a compact trailing row and retain an explicit `Agotado` disabled button. Do not add editorial imagery as a product fallback; the existing text fallback remains honest.

- [ ] **Step 5: Update loading and catalog CSS**

Create stable skeleton aspect ratios, horizontally scrollable filter pills on mobile, a compact search/sort toolbar and a responsive product rail/grid. Ensure controls do not resize when result count or labels change.

```css
.catalog-tools { display: grid; gap: var(--space-4); }
.category-filters { display: flex; gap: var(--space-2); overflow-x: auto; scrollbar-width: none; }
.category-filters button { min-height: 44px; flex: 0 0 auto; border-radius: 999px; }
.catalog-controls { display: grid; grid-template-columns: minmax(0, 1fr) minmax(190px, auto); gap: var(--space-3); }
.catalog-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-6) var(--space-4); }
.catalog-loading > span { display: block; aspect-ratio: 16 / 5; }
@media (max-width: 640px) { .catalog-controls { grid-template-columns: 1fr; } }
```

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- tests/components/catalog-client.test.tsx tests/components/product-card.test.tsx && npm run typecheck`

Expected: tests PASS and TypeScript exits 0.

```bash
git add components/ProductCard.tsx tests/components/product-card.test.tsx tests/components/catalog-client.test.tsx app/catalogo app/globals.css
git commit -m "refactor: redesign live product catalog"
```

## Task 7: Refactor Product Detail Interaction

**Files:**
- Create: `tests/components/product-detail.test.tsx`
- Modify: `app/catalogo/[slug]/ProductDetail.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write product interaction tests**

Mock `useCart` and render a live product with one in-stock and one sold-out variant. Assert that selecting a variant resets quantity, quantity never exceeds real stock, sold-out variants are disabled and adding calls:

```tsx
expect(addProduct).toHaveBeenCalledWith(product, product.variants[0], 2)
expect(screen.getByRole('button', { name: 'Agregado al carrito' })).toBeInTheDocument()
```

Also assert the fallback description remains `Información del producto disponible próximamente.` only when BilBildin provides no description.

- [ ] **Step 2: Run the test and verify the new accessible success name fails**

Run: `npm test -- tests/components/product-detail.test.tsx`

Expected: FAIL because the test does not exist and current success copy is `Agregado`.

- [ ] **Step 3: Implement the refined detail layout**

- Keep all current live-product calculations and cart calls.
- Change the back label to `Volver a la colección`.
- Use `Elige tu opción` as the variant legend.
- Set success label and live feedback to `Agregado al carrito`.
- Add `aria-live="polite"` around the add-state label.
- Keep real stock count and disabled quantity limits.
- Use an image-led layout with sticky purchase copy on wide screens and no decorative card around the main gallery.

```tsx
<button type="button" className="button button-primary add-button" disabled={!available} onClick={add}>
  <span aria-live="polite">
    {added ? <><Check aria-hidden="true" size={18} /> Agregado al carrito</> : available ? <><ShoppingBag aria-hidden="true" size={18} /> Agregar al carrito</> : 'Agotado'}
  </span>
</button>
```

- [ ] **Step 4: Add focused detail CSS and reduced-motion feedback**

Use a stable portrait/near-square media region, compact variant pills, 44px quantity controls and a sticky desktop purchase panel. Button feedback uses transform and color for at most 180ms; reduced motion removes transform.

```css
.detail-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr); gap: clamp(32px, 6vw, 88px); }
.detail-media { position: relative; min-height: 640px; overflow: hidden; border-radius: 44px 8px 44px 8px; }
.detail-copy { position: sticky; top: 96px; align-self: start; }
.quantity-control button { width: 44px; height: 44px; }
.add-button { transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out); }
@media (max-width: 820px) { .detail-layout { grid-template-columns: 1fr; } .detail-media { min-height: 70svh; } .detail-copy { position: static; } }
@media (prefers-reduced-motion: reduce) { .add-button { transition-property: background-color; } }
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/components/product-detail.test.tsx tests/context/cart.test.tsx && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

```bash
git add -- ':(literal)app/catalogo/[slug]/ProductDetail.tsx' tests/components/product-detail.test.tsx app/globals.css
git commit -m "refactor: polish product selection flow"
```

## Task 8: Refactor Cart And Checkout Without Changing Order Logic

**Files:**
- Modify: `app/carrito/page.tsx`
- Modify: `app/checkout/CheckoutClient.tsx`
- Modify: `tests/components/checkout.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Expand checkout validation tests**

Assert that incomplete submission preserves the entered name, renders `Revisa los campos marcados para continuar.`, marks required invalid inputs with `aria-invalid="true"`, and does not call `createOrder`. Keep the existing server failure assertion and add a sending-state assertion that disables the submit button.

- [ ] **Step 2: Run the checkout tests and verify inline validation fails**

Run: `npm test -- tests/components/checkout.test.tsx`

Expected: FAIL because validation currently uses one global message and no `aria-invalid` fields.

- [ ] **Step 3: Implement inline checkout validation**

Add a typed error map:

```tsx
type FieldErrors = Partial<Record<'name' | 'email' | 'address', string>>

const validate = (): FieldErrors => ({
  ...(!form.name.trim() ? { name: 'Escribe tu nombre.' } : {}),
  ...(!form.email.trim() ? { email: 'Escribe tu correo.' } : {}),
  ...(!form.address.trim() ? { address: 'Escribe la dirección de entrega.' } : {}),
})
```

On submit, store field errors, show the approved summary alert, focus the first invalid input through refs and return without clearing any field. Keep `createOrder`, server-side stock/price authority, `sending`, `clear()` and confirmation redirect unchanged.

- [ ] **Step 4: Apply warm purchase copy**

- Cart H1: `Lo que elegiste.`
- Empty cart H2: `Tu selección empieza aquí.`
- Checkout H1: `Terminemos juntas.`
- Submit pending text: `Confirmando tu pedido`.
- Keep payment method labels and instructions exactly as provided by live business configuration.

- [ ] **Step 5: Refine operational layouts**

Use stable cart line media, 44px quantity/remove controls, a sticky summary on desktop and a single-column mobile flow. Checkout uses an unframed form plus one 8px summary panel; avoid nested cards. Errors use pink only as a small signal and never glow.

```css
.cart-layout, .checkout-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 380px); gap: clamp(28px, 5vw, 72px); align-items: start; }
.cart-line { display: grid; grid-template-columns: 112px minmax(0, 1fr) auto; gap: var(--space-4); padding-block: var(--space-4); border-bottom: 1px solid rgba(234, 251, 251, 0.12); }
.cart-line-image { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 8px; }
.cart-summary, .checkout-summary { position: sticky; top: 96px; border: 1px solid rgba(234, 251, 251, 0.12); border-radius: 8px; padding: var(--space-6); }
.field-block input[aria-invalid="true"] { border-color: var(--color-pink); }
.form-error { color: var(--color-ice); }
@media (max-width: 820px) { .cart-layout, .checkout-layout { grid-template-columns: 1fr; } .cart-summary, .checkout-summary { position: static; } }
```

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- tests/components/checkout.test.tsx tests/context/cart.test.tsx tests/commerce/checkout.test.ts && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

```bash
git add app/carrito/page.tsx app/checkout/CheckoutClient.tsx tests/components/checkout.test.tsx app/globals.css
git commit -m "refactor: calm cart and checkout experience"
```

## Task 9: Unify Orders, Policies And Recovery

**Files:**
- Create: `tests/components/order-presentation.test.tsx`
- Create: `tests/components/policy-page.test.tsx`
- Modify: `components/commerce/OrderPresentation.tsx`
- Modify: `components/site/PolicyPage.tsx`
- Modify: `app/error.tsx`
- Modify: `app/not-found.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write order and policy semantic tests**

For confirmation, assert `Pedido confirmado.`, the real order number and tracking link. For tracking, assert the mapped status, event title and formatted location. For `PolicyPage`, assert one H1, all supplied H2 sections and the current-version note.

- [ ] **Step 2: Run tests and establish the current behavioral baseline**

Run: `npm test -- tests/components/order-presentation.test.tsx tests/components/policy-page.test.tsx`

Expected: initial FAIL because the new test files do not exist; after adding them, existing behavior should mostly PASS and reveal copy/style expectations still to update.

- [ ] **Step 3: Apply the shared V0.2 order presentation**

Keep `CommerceOrder`, status mapping, payment mapping, totals and tenant-scoped route reads unchanged. Use warm headings: confirmation remains `Pedido confirmado.` and tracking becomes `Tu pedido sigue su camino.`. Preserve factual event data and use the official mark as a decorative brand accent.

- [ ] **Step 4: Apply the quiet reading and recovery layouts**

Policy pages use a narrow readable column, anchored section rhythm and no floating cards. Global error uses `No pudimos abrir esta vista.` with `Intentar de nuevo`; not-found uses `No encontramos esta página.` with `Ver la colección`. Neither exposes the error object, environment or integration details in rendered text.

```tsx
// app/error.tsx rendered content
<div className="recovery-page container"><p className="section-label">FYTHER</p><h2 className="display">No pudimos abrir esta vista.</h2><p>Tu selección sigue guardada en este navegador.</p><button type="button" className="button button-primary" onClick={reset}>Intentar de nuevo</button></div>

// app/not-found.tsx rendered content
<div className="recovery-page container"><p className="section-label">FYTHER / 404</p><h2 className="display">No encontramos esta página.</h2><p>El enlace puede haber cambiado o ya no estar disponible.</p><Link href="/catalogo" className="button button-primary">Ver la colección</Link></div>
```

```css
.policy-page { max-width: 980px; padding-block: 160px var(--space-24); }
.policy-page > header { max-width: 70ch; }
.policy-sections { display: grid; gap: var(--space-12); max-width: 72ch; }
.recovery-page { min-height: 78svh; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: var(--space-4); max-width: 760px; }
```

- [ ] **Step 5: Add route CSS and run tests**

Run: `npm test -- tests/components/order-presentation.test.tsx tests/components/policy-page.test.tsx tests/commerce/orders.test.ts && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add components/commerce/OrderPresentation.tsx components/site/PolicyPage.tsx app/error.tsx app/not-found.tsx tests/components/order-presentation.test.tsx tests/components/policy-page.test.tsx app/globals.css
git commit -m "refactor: unify order and trust surfaces"
```

## Task 10: Add Full-Route E2E And Visual Verification

**Files:**
- Modify: `e2e/store.spec.ts`
- Modify: `playwright.config.ts`
- Modify if a verified defect requires it: `app/globals.css`
- Modify: route/component files only for verified defects

- [ ] **Step 1: Replace retired E2E expectations**

The home test must assert:

```ts
await expect(page.getByRole('heading', { name: 'Muévete a tu manera.' })).toBeVisible()
await expect(page.getByRole('link', { name: 'Ver la colección' })).toBeVisible()
await expect(page.getByText(/modo demo|productos de demostración|simulación|Motion Tee|Training Layer|Daily Bag|Recovery Cap/i)).toHaveCount(0)
await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
```

Add mobile-menu Escape coverage, trust/legal route coverage and an assertion that the unconfigured catalog uses customer-safe text without `Supabase`, `key` or `endpoint`.

- [ ] **Step 2: Add tablet visual coverage**

Extend `playwright.config.ts` with:

```ts
{ name: 'tablet', use: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } }
```

Keep desktop and Pixel 7 projects.

- [ ] **Step 3: Add reduced-motion verification**

```ts
test('respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const maxDuration = await page.locator('[data-reveal]').first().evaluate((element) => {
    const style = getComputedStyle(element)
    const seconds = `${style.animationDuration},${style.transitionDuration}`.split(',').map((value) => value.trim()).map((value) => value.endsWith('ms') ? Number.parseFloat(value) / 1000 : Number.parseFloat(value))
    return Math.max(...seconds)
  })
  expect(maxDuration).toBeLessThanOrEqual(0.15)
})
```

- [ ] **Step 4: Run unit, lint and type checks**

Run:

```bash
npm test
npm run lint
npm run typecheck
```

Expected: all unit tests PASS; lint and TypeScript exit 0.

- [ ] **Step 5: Run Playwright and inspect generated screenshots**

Run: `npm run test:e2e`

Expected: all desktop, tablet and mobile projects PASS with no browser errors, framework dialogs or horizontal overflow.

Open every `home-final-*.png` result and inspect hero framing, header logo, all scene transitions, catalog, footer, text wrapping and whitespace. Use browser screenshots for product/cart/checkout with available live fixtures; when credentials are absent, verify their honest empty/unconfigured states instead of injecting fixtures.

- [ ] **Step 6: Verify exact responsive dimensions in the browser**

Check at `390x844`, `768x1024` and `1440x900`:

- Header controls do not overlap the official logo.
- Hero leaves the current rail visible.
- Text stays inside media/copy islands.
- Product and category rails do not create page-level overflow.
- Checkout summary does not cover form actions.
- Focus states remain visible.
- Reduced motion removes current, drift and camera movement.

Fix only defects proven by these checks, rerunning the narrow affected test after every correction.

- [ ] **Step 7: Run production and security verification**

Run:

```bash
npm run build
npm audit --audit-level=high
git diff --check
git status --short
```

Expected: production build succeeds, audit reports 0 high/critical vulnerabilities, diff check is clean and status contains only intended redesign files.

- [ ] **Step 8: Commit final polish**

```bash
git add app components public tests e2e playwright.config.ts DESIGN.md
git commit -m "test: verify Fyther V0.2 storefront"
```

## Task 11: Final Review And Delivery

**Files:**
- Review: all changed files
- Review: `docs/superpowers/specs/2026-08-07-fyther-v02-neon-door-redesign-design.md`

- [ ] **Step 1: Run the complete quality gate from a clean process**

Stop stale development servers, then run:

```bash
npm test
npm run lint
npm run typecheck
npm run test:e2e
npm run build
npm audit --audit-level=high
```

Expected: every command exits 0.

- [ ] **Step 2: Review the implementation against every acceptance criterion**

Confirm there is direct evidence for all of the following:

- Complete route coverage.
- Official assets used only in approved roles.
- No V0.1 green, text wordmark or `MOVE DIFFERENT.` hero remains.
- No simulated commerce exists.
- BilBildin data and credential boundaries remain unchanged.
- Empty, unconfigured and error states are customer-safe.
- Fyther Current works and reduces correctly.
- Mobile, tablet and desktop screenshots are polished.
- No console errors, overlap or horizontal overflow.

- [ ] **Step 3: Inspect the final diff and commit any review-only correction**

Run: `git diff origin/main...HEAD --stat && git log --oneline origin/main..HEAD`

Expected: only specification, plan, design assets, storefront code, tests and design documentation are included.

If a correction was required, rerun its narrow test and create one focused commit. If no correction was required, do not create an empty commit.

- [ ] **Step 4: Push only after verification succeeds**

Run: `git push origin codex/fyther-v1-impl:main`

Expected: GitHub `main` advances to the verified final commit without a force push.
