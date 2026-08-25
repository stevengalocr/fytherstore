# Footer Background and Sales Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized human editorial scene with a compact animated sales rail and present the product campaign as a full-background, mobile-friendly footer.

**Architecture:** Introduce a focused server component, `SalesRail`, and keep its motion CSS-only so the page adds no client runtime. Refactor `Footer` so its optimized image is decorative and positioned behind semantic content, then remove superseded human assets and selectors.

**Tech Stack:** Next.js App Router, React 19, TypeScript, `next/image`, `next/link`, Lucide React, CSS, Vitest, Testing Library, Playwright.

---

## File Map

- Create `components/site/SalesRail.tsx`: commercial message, catalog CTA, and decorative ticker groups.
- Delete `components/site/EditorialStory.tsx`: obsolete image-led transition.
- Modify `app/page.tsx`: render `SalesRail` in the existing home-page sequence.
- Modify `components/Footer.tsx`: place the campaign behind semantic footer content.
- Modify `app/globals.css`: add sales rail and background footer systems; remove obsolete selectors.
- Modify `tests/components/home-scenes.test.tsx`: sales rail content, dimensions, and motion contracts.
- Modify `tests/components/header.test.tsx`: decorative footer media and responsive contracts.
- Modify `tests/assets.test.ts`: remove deleted human-asset contracts.
- Modify `e2e/store.spec.ts`: validate compact sales rail and footer background across viewports.
- Delete `public/editorial/community-movement.webp`, `public/editorial/footer-community-v2.webp`, and `public/editorial/footer-movement.webp`.

### Task 1: Replace EditorialStory with SalesRail

**Files:**
- Create: `components/site/SalesRail.tsx`
- Delete: `components/site/EditorialStory.tsx`
- Modify: `app/page.tsx`
- Test: `tests/components/home-scenes.test.tsx`

- [ ] **Step 1: Write the failing sales rail component contract**

Replace the `EditorialStory` import and its first test with:

```tsx
import SalesRail from '@/components/site/SalesRail'

it('uses a compact sales rail to lead into the complete collection', () => {
  const { container } = render(<SalesRail />)
  const rail = container.querySelector('#fyther.sales-rail') as HTMLElement

  expect(rail).toHaveAttribute('aria-labelledby', 'sales-rail-title')
  expect(within(rail).getByRole('heading', { name: 'Tu próximo favorito ya está aquí.', level: 2 })).toBeInTheDocument()
  expect(within(rail).getByText('Prendas y accesorios originales, con SINPE y opción de apartado.')).toBeInTheDocument()
  expect(within(rail).getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
  expect(rail.querySelectorAll('.sales-ticker-group')).toHaveLength(2)
  expect(rail.querySelector('.sales-ticker')).toHaveAttribute('aria-hidden', 'true')
  expect(within(rail).queryByRole('img')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/components/home-scenes.test.tsx`

Expected: FAIL because `@/components/site/SalesRail` does not exist.

- [ ] **Step 3: Implement the SalesRail server component**

Create `components/site/SalesRail.tsx`:

```tsx
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const salesPoints = ['Productos originales', 'SINPE', 'Apartados', 'Correos de Costa Rica']

export default function SalesRail() {
  return (
    <section id="fyther" className="sales-rail" data-reveal aria-labelledby="sales-rail-title">
      <div className="sales-rail-content container">
        <div className="sales-rail-copy">
          <h2 id="sales-rail-title">Tu próximo favorito ya está aquí.</h2>
          <p>Prendas y accesorios originales, con SINPE y opción de apartado.</p>
        </div>
        <Link className="sales-rail-cta" href="/catalogo">
          Ver la colección
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
        </Link>
      </div>
      <div className="sales-ticker" aria-hidden="true">
        <div className="sales-ticker-track">
          {[0, 1].map((group) => (
            <div className="sales-ticker-group" key={group}>
              {salesPoints.map((point) => <span key={`${group}-${point}`}>{point}</span>)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Wire the component into the page and delete EditorialStory**

In `app/page.tsx`, replace the old import and usage with:

```tsx
import SalesRail from '@/components/site/SalesRail'
```

```tsx
<SalesRail />
```

Delete `components/site/EditorialStory.tsx`.

- [ ] **Step 5: Run the focused test and commit**

Run: `npm test -- tests/components/home-scenes.test.tsx`

Expected: the sales rail component contract passes.

```bash
git add app/page.tsx components/site/SalesRail.tsx components/site/EditorialStory.tsx tests/components/home-scenes.test.tsx
git commit -m "feat: replace editorial scene with sales rail"
```

### Task 2: Add Compact Layout and Purposeful Motion

**Files:**
- Modify: `app/globals.css`
- Test: `tests/components/home-scenes.test.tsx`

- [ ] **Step 1: Add failing CSS contracts**

Append to the sales rail test:

```tsx
expect(globalsCss).toMatch(/\.sales-rail\s*\{[^}]*min-height:\s*112px;[^}]*overflow:\s*hidden/)
expect(globalsCss).toMatch(/\.sales-rail-cta\s*\{[^}]*min-height:\s*44px/)
expect(globalsCss).toMatch(/@media \(prefers-reduced-motion:\s*no-preference\)[\s\S]*?\.sales-ticker-track\s*\{[^}]*animation:\s*sales-ticker/)
expect(globalsCss).toMatch(/\.sales-rail:focus-within[\s\S]*?animation-play-state:\s*paused/)
expect(globalsCss).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.sales-ticker-group:nth-child\(2\)\s*\{[^}]*display:\s*none/)
expect(globalsCss).not.toMatch(/\.editorial-story(?:-|\s|\{)/)
```

- [ ] **Step 2: Run the test and verify the style contract fails**

Run: `npm test -- tests/components/home-scenes.test.tsx`

Expected: FAIL because sales rail styles do not exist and editorial selectors remain.

- [ ] **Step 3: Replace editorial CSS with the sales rail system**

Remove every `.editorial-story*` rule and add:

```css
.sales-rail { min-height: 112px; overflow: hidden; border-block: 1px solid rgba(110, 239, 242, 0.28); display: grid; background: var(--color-night-raised); }
.sales-rail-content { min-height: 82px; padding-block: 1rem; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: clamp(1rem, 4vw, 4rem); }
.sales-rail-copy { min-width: 0; display: flex; align-items: baseline; gap: clamp(0.75rem, 2vw, 1.5rem); }
.sales-rail-copy h2 { margin: 0; font-family: var(--font-display), sans-serif; font-size: clamp(1.4rem, 2.6vw, 2.35rem); line-height: 1; }
.sales-rail-copy p { max-width: 42ch; margin: 0; color: var(--color-mist); font-size: 0.82rem; line-height: 1.5; }
.sales-rail-cta { min-height: 44px; padding-inline: 1rem; border: 1px solid var(--color-cyan); border-radius: var(--radius-pill); display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; color: var(--color-night); background: var(--color-cyan); font-size: 0.82rem; font-weight: 800; white-space: nowrap; }
.sales-ticker { overflow: hidden; border-top: 1px solid rgba(234, 251, 251, 0.12); background: var(--color-night); }
.sales-ticker-track { width: max-content; display: flex; }
.sales-ticker-group { min-height: 30px; display: flex; align-items: center; }
.sales-ticker-group span { display: inline-flex; align-items: center; gap: 1rem; padding-inline: 1.25rem; color: var(--color-mist); font-size: 0.65rem; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
.sales-ticker-group span::after { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--color-pink); }
.sales-rail:hover .sales-ticker-track,
.sales-rail:focus-within .sales-ticker-track { animation-play-state: paused; }
@keyframes sales-ticker { to { transform: translateX(-50%); } }
```

Inside `@media (prefers-reduced-motion: no-preference)` add:

```css
.sales-ticker-track { animation: sales-ticker 28s linear infinite; }
```

Inside `@media (max-width: 767px)` add:

```css
.sales-rail { min-height: 144px; }
.sales-rail-content { min-height: 112px; grid-template-columns: minmax(0, 1fr) auto; gap: 0.75rem; }
.sales-rail-copy { display: block; }
.sales-rail-copy h2 { font-size: 1.55rem; }
.sales-rail-copy p { margin-top: 0.4rem; font-size: 0.75rem; }
```

Inside `@media (max-width: 560px)` add:

```css
.sales-rail-content { grid-template-columns: 1fr; padding-block: 1rem; }
.sales-rail-cta { width: 100%; }
```

Inside `@media (prefers-reduced-motion: reduce)` add:

```css
.sales-ticker-track { transform: none !important; }
.sales-ticker-group:nth-child(2) { display: none; }
```

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- tests/components/home-scenes.test.tsx`

Expected: PASS.

```bash
git add app/globals.css tests/components/home-scenes.test.tsx
git commit -m "style: add compact animated sales rail"
```

### Task 3: Refactor Footer into a Full-Background Campaign

**Files:**
- Modify: `components/Footer.tsx`
- Modify: `app/globals.css`
- Test: `tests/components/header.test.tsx`

- [ ] **Step 1: Replace footer media tests with failing background contracts**

Replace the current image and radius tests with:

```tsx
it('uses the approved product campaign as a decorative full footer background', () => {
  const { container } = render(<Footer />)
  const backdrop = container.querySelector('.footer-backdrop') as HTMLElement
  const image = backdrop.querySelector('img') as HTMLImageElement

  expect(image).toHaveAttribute('alt', '')
  expect(decodeURIComponent(image.getAttribute('src') ?? '')).toContain('/editorial/footer-product-campaign-v3.webp')
  expect(image).toHaveAttribute('sizes', '100vw')
  expect(screen.queryByRole('img', { name: /prendas, calzado y accesorios/i })).not.toBeInTheDocument()
  expect(container.querySelector('.footer-scrim')).toHaveAttribute('aria-hidden', 'true')
})

it('lays footer content over the campaign with resilient mobile targets', () => {
  expect(globalsCss).toMatch(/\.site-footer\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden/)
  expect(globalsCss).toMatch(/\.footer-backdrop\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/)
  expect(globalsCss).toMatch(/\.footer-content\s*\{[^}]*width:\s*min\(100%,\s*620px\);[^}]*margin-left:\s*auto/)
  expect(compactMobileCss).toMatch(/\.footer-contact a\s*\{[^}]*min-height:\s*48px;[^}]*overflow-wrap:\s*anywhere/)
})
```

Keep all existing navigation, service, logo, contact, and legal assertions.

- [ ] **Step 2: Run footer tests and verify they fail**

Run: `npm test -- tests/components/header.test.tsx`

Expected: FAIL because `.footer-media` is still a content column and background selectors do not exist.

- [ ] **Step 3: Refactor Footer markup**

Place this immediately inside `<footer>` and remove `.footer-media`:

```tsx
<div className="footer-backdrop" aria-hidden="true">
  <Image src="/editorial/footer-product-campaign-v3.webp" alt="" fill sizes="100vw" />
</div>
<div className="footer-scrim" aria-hidden="true" />
```

Keep `.footer-content` as the only child of `.footer-top`, preserving all existing brand, trust, navigation, contact, and footer-bottom content.

- [ ] **Step 4: Replace split-column footer CSS**

Use these base rules and delete `.footer-media` selectors:

```css
.site-footer { position: relative; overflow: hidden; border-top: 1px solid rgba(234, 251, 251, 0.16); background: var(--color-night-raised); color: var(--color-ice); padding: clamp(3rem, 7vw, 6rem) var(--space-4) 1.25rem; isolation: isolate; }
.footer-backdrop { position: absolute; inset: 0; z-index: -2; }
.footer-backdrop img { object-fit: cover; object-position: 38% center; filter: saturate(0.9) contrast(1.06); }
.footer-scrim { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(5, 6, 8, 0.2) 0%, rgba(5, 6, 8, 0.58) 42%, rgba(5, 6, 8, 0.96) 72%), linear-gradient(0deg, rgba(5, 6, 8, 0.96), transparent 48%); pointer-events: none; }
.footer-top, .footer-bottom { position: relative; width: min(100%, var(--container)); margin-inline: auto; }
.footer-top { min-width: 0; min-height: 520px; display: flex; align-items: stretch; }
.footer-content { width: min(100%, 620px); min-width: 0; margin-left: auto; display: flex; flex-direction: column; justify-content: space-between; gap: 1.5rem; }
```

Inside `@media (max-width: 767px)` replace split-footer overrides with:

```css
.site-footer { padding-top: 3rem; }
.footer-backdrop img { object-position: 44% top; }
.footer-scrim { background: linear-gradient(0deg, rgba(5, 6, 8, 0.98) 16%, rgba(5, 6, 8, 0.86) 70%, rgba(5, 6, 8, 0.54) 100%); }
.footer-top { min-height: 0; }
.footer-content { gap: 1.5rem; }
```

Retain responsive brand, links, trust, contact, and footer-bottom rules.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/components/header.test.tsx tests/components/home-scenes.test.tsx`

Expected: PASS.

```bash
git add components/Footer.tsx app/globals.css tests/components/header.test.tsx
git commit -m "feat: use campaign as full footer background"
```

### Task 4: Remove Human Assets and Update Browser Contracts

**Files:**
- Delete: `public/editorial/community-movement.webp`
- Delete: `public/editorial/footer-community-v2.webp`
- Delete: `public/editorial/footer-movement.webp`
- Modify: `tests/assets.test.ts`
- Modify: `e2e/store.spec.ts`

- [ ] **Step 1: Add failing browser expectations**

Change the configured vertical-order selector from `.editorial-story` to `.sales-rail`. Add:

```ts
const salesRail = page.locator('.sales-rail')
await expect(salesRail.getByRole('heading', { name: 'Tu próximo favorito ya está aquí.' })).toBeVisible()
await expect(salesRail.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
expect((await salesRail.boundingBox())?.height ?? Infinity).toBeLessThan(192)
```

Replace every accessible footer image locator with:

```ts
const footerImage = footer.locator('.footer-backdrop img')
```

In the responsive image test add:

```ts
await expect(footer.locator('.footer-media')).toHaveCount(0)
await expect(footer.locator('.footer-backdrop')).toHaveCount(1)
```

- [ ] **Step 2: Run the relevant browser test and confirm failure before cleanup**

Run: `npx playwright test e2e/store.spec.ts --project=desktop-configured --grep "static responsive hero|product-only campaign content|efficient footer|mobile footer"`

Expected: FAIL against the old selector or old footer structure before all changes are applied.

- [ ] **Step 3: Remove obsolete image contracts and files**

Delete the three legacy entries from the `assets` array in `tests/assets.test.ts`, then delete the corresponding files. Keep the approved footer campaign asset and SHA-256 contract unchanged.

- [ ] **Step 4: Confirm no obsolete references remain**

Run:

```bash
rg -n "EditorialStory|editorial-story|community-movement|footer-community-v2|footer-movement|footer-media" app components tests e2e public
```

Expected: no matches.

- [ ] **Step 5: Run focused validation and commit**

Run:

```bash
npm test -- tests/assets.test.ts tests/components/home-scenes.test.tsx tests/components/header.test.tsx
npx playwright test e2e/store.spec.ts --project=desktop-configured --grep "static responsive hero|product-only campaign content|efficient footer|mobile footer"
npx playwright test e2e/store.spec.ts --project=mobile-configured --grep "static responsive hero|mobile footer"
```

Expected: all selected tests PASS.

```bash
git add e2e/store.spec.ts tests/assets.test.ts public/editorial/community-movement.webp public/editorial/footer-community-v2.webp public/editorial/footer-movement.webp
git commit -m "test: cover sales rail and footer background"
```

### Task 5: Full Verification, Integration, and Push

**Files:**
- Modify only files required by verification findings.

- [ ] **Step 1: Run every static and unit quality gate**

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:dead-code
npm audit --audit-level=high
```

Expected: every command exits `0`; no high or critical dependency vulnerabilities.

- [ ] **Step 2: Run the complete Playwright suite**

Run: `npm run test:e2e`

Expected: all configured and unconfigured projects PASS, with only intentional project skips.

- [ ] **Step 3: Start production mode locally**

Run: `npm run start -- --hostname 127.0.0.1 --port 64141`

Expected: Next.js reports `http://127.0.0.1:64141` ready. Keep the process running during visual verification.

- [ ] **Step 4: Verify responsive presentation**

Use Playwright at `1440x900`, `768x1024`, `390x844`, and `320x568`. Confirm the sales rail stays below 144 px at desktop and below 192 px at 390 px; no horizontal overflow occurs; footer content is readable and hit-testable; the footer crop shows products without people; ticker motion pauses on CTA focus; and reduced motion displays one static ticker group. Save full-page and footer screenshots.

- [ ] **Step 5: Inspect runtime health**

Expected: no page errors, console errors, failed images, overlap, or broken links. The footer image resolves to `/editorial/footer-product-campaign-v3.webp` through Next Image optimization.

- [ ] **Step 6: Commit verification fixes when needed**

```bash
git add app components tests e2e public
git commit -m "test: harden footer campaign experience"
git status --short
```

Expected: create the commit only when verification required changes; final status is clean.

- [ ] **Step 7: Integrate and push**

```bash
git switch main
git pull --ff-only origin main
git merge --ff-only codex/footer-background-sales-rail
git push origin main
```

Expected: `main` advances to the verified feature commit and `origin/main` matches it.

- [ ] **Step 8: Verify production**

Wait for the Vercel deployment of the pushed commit to become `Ready`. Confirm `https://www.fytherstore.com/` returns `200`, the new sales rail appears, the footer uses the campaign as its background, and all footer links remain functional.
