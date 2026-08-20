# Fyther Soft Performance Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar toda la tienda Fyther en una experiencia performance editorial suave, responsiva y mantenible, con un hero de video controlado por scroll y datos comerciales administrados exclusivamente desde BilBildin.

**Architecture:** La presentación seguirá consumiendo el contrato `CommerceProduct`; solo el adaptador BilBildin conocerá Supabase. El movimiento complejo del hero se aislará en una función pura y un componente cliente, mientras el resto de la tienda conservará HTML semántico, scroll nativo y degradación accesible. Los estilos permanecerán en `app/globals.css` para no romper las verificaciones existentes que inspeccionan ese archivo, pero se organizarán por secciones y tokens explícitos.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Supabase/BilBildin, Sharp, Lucide React, Vitest, Testing Library y Playwright.

---

## File Map

**Create**

- `lib/hero-scroll.ts`: cálculo puro, acotado y monotónico del avance del video.
- `tests/hero-scroll.test.ts`: contrato unitario del recorrido, corte final y monotonicidad.
- `scripts/prepare-fyther-assets.mjs`: normalización de dimensiones, WebP y transparencia.
- `tests/assets.test.ts`: dimensiones, formato, alpha y peso de activos finales.
- `components/site/FaqAccordion.tsx`: acordeón exclusivo y accesible.
- `tests/components/faq-accordion.test.tsx`: apertura exclusiva y semántica del FAQ.
- `public/brand/fyther-mark-header.webp`: marca transparente de header.
- `public/brand/fyther-mark-footer.webp`: marca transparente de footer.
- `public/editorial/hero-poster-desktop.webp`: póster 16:9 derivado del video.
- `public/editorial/hero-poster-mobile.webp`: póster vertical derivado del video.
- `public/editorial/collection-ropa.webp`: portal editorial de Ropa.
- `public/editorial/collection-accesorios.webp`: portal editorial de Accesorios.
- `public/editorial/community-movement.webp`: fotografía editorial de comunidad.
- `public/editorial/footer-movement.webp`: cierre editorial panorámico.

**Modify**

- `lib/commerce/types.ts`: marca normalizada en `CommerceProduct`.
- `lib/commerce/mappers.ts`: lectura segura de `attributes.brand`.
- `lib/commerce/e2e-fixture.ts`: marcas reales de prueba.
- `lib/home-selection.ts`: selección de hasta cuatro productos sin duplicados.
- `components/BrandMark.tsx`: activos transparentes nuevos.
- `components/Header.tsx`: navegación completa, estado compacto y móvil.
- `components/Footer.tsx`: fotografía, confianza, seguimiento y enlaces.
- `components/site/HeroMedia.tsx`: scrub corto, póster y degradación accesible.
- `components/site/MotionTrack.tsx`: franja estable de confianza.
- `components/site/CollectionWorlds.tsx`: portales asimétricos y rail nativo.
- `components/site/CollectionSection.tsx`: cuadrícula 4/3/2 y rail móvil.
- `components/site/EditorialStory.tsx`: nueva pausa editorial.
- `components/site/TrustFaq.tsx`: datos del acordeón.
- `components/ProductCard.tsx`: marca, descuento, agotado y navegación completa.
- `app/page.tsx`: composición final de portada.
- `app/layout.tsx`: metadatos y Open Graph con póster nuevo.
- `app/catalogo/CatalogClient.tsx`: búsqueda por marca y controles renovados.
- `app/catalogo/[slug]/ProductDetail.tsx`: jerarquía y datos de marca.
- `app/carrito/page.tsx`: estructura visual del carrito.
- `app/checkout/CheckoutClient.tsx`: agrupación visual sin cambiar el envío.
- `components/commerce/OrderPresentation.tsx`: confirmación y tracking visual.
- `components/site/PolicyPage.tsx`: lectura y geometría coherentes.
- `app/globals.css`: tokens, responsive, motion y todas las superficies.
- `e2e/store.spec.ts`: recorrido visual, responsive y accesibilidad.
- Pruebas de componentes y fixtures que construyen `CommerceProduct`.

---

### Task 1: Normalize BilBildin Brand Data

**Files:**
- Modify: `lib/commerce/types.ts`
- Modify: `lib/commerce/mappers.ts`
- Modify: `lib/commerce/e2e-fixture.ts`
- Modify: `tests/commerce/mappers.test.ts`
- Modify: `tests/home-selection.test.ts`
- Modify: component test fixtures containing `CommerceProduct`

- [ ] **Step 1: Write the failing mapper tests**

Add to `tests/commerce/mappers.test.ts`:

```ts
it('maps a trimmed brand from BilBildin attributes', () => {
  expect(mapBilBildinProduct({
    ...row,
    attributes: { brand: '  Nike  ' },
  }).brand).toBe('Nike')
})

it('does not infer a brand when the attribute is absent or invalid', () => {
  expect(mapBilBildinProduct({ ...row, name: 'Nike Motion Tee', attributes: {} }).brand).toBeNull()
  expect(mapBilBildinProduct({ ...row, attributes: { brand: 42 } }).brand).toBeNull()
  expect(mapBilBildinProduct({ ...row, attributes: { brand: '   ' } }).brand).toBeNull()
})
```

- [ ] **Step 2: Run the mapper test and verify the failure**

Run: `npm test -- tests/commerce/mappers.test.ts`

Expected: FAIL because `CommerceProduct` does not expose `brand` and the mapper returns no brand.

- [ ] **Step 3: Add the canonical brand contract and mapper**

Add to `CommerceProduct` in `lib/commerce/types.ts`:

```ts
brand: string | null
```

Add to `lib/commerce/mappers.ts`:

```ts
function mapBrand(attributes: Record<string, unknown> | null): string | null {
  const brand = attributes?.brand
  if (typeof brand !== 'string') return null
  const normalized = brand.trim()
  return normalized || null
}
```

Return `brand: mapBrand(row.attributes)` from `mapBilBildinProduct()`. Add `brand: null` to every handwritten `CommerceProduct` fixture and use `brand: 'Nike'`, `brand: 'Alo'` and `brand: null` in `lib/commerce/e2e-fixture.ts` so all three states are covered.

- [ ] **Step 4: Run mapper, selection and type checks**

Run: `npm test -- tests/commerce/mappers.test.ts tests/home-selection.test.ts && npm run typecheck`

Expected: all selected tests PASS and TypeScript reports no missing `brand` fields.

- [ ] **Step 5: Commit the commerce contract**

```bash
git add lib/commerce/types.ts lib/commerce/mappers.ts lib/commerce/e2e-fixture.ts tests
git commit -m "feat: normalize BilBildin product brands"
```

---

### Task 2: Produce and Validate Editorial Assets

**Files:**
- Create: `scripts/prepare-fyther-assets.mjs`
- Create: `tests/assets.test.ts`
- Create: `public/brand/fyther-mark-header.webp`
- Create: `public/brand/fyther-mark-footer.webp`
- Create: `public/editorial/hero-poster-desktop.webp`
- Create: `public/editorial/hero-poster-mobile.webp`
- Create: `public/editorial/collection-ropa.webp`
- Create: `public/editorial/collection-accesorios.webp`
- Create: `public/editorial/community-movement.webp`
- Create: `public/editorial/footer-movement.webp`

- [ ] **Step 1: Write asset contract tests**

Create `tests/assets.test.ts`:

```ts
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

const assets = [
  ['brand/fyther-mark-header.webp', 640, 640, true],
  ['brand/fyther-mark-footer.webp', 960, 960, true],
  ['editorial/hero-poster-desktop.webp', 2400, 1350, false],
  ['editorial/hero-poster-mobile.webp', 1200, 1500, false],
  ['editorial/collection-ropa.webp', 1600, 2000, false],
  ['editorial/collection-accesorios.webp', 1600, 2000, false],
  ['editorial/community-movement.webp', 2000, 1200, false],
  ['editorial/footer-movement.webp', 1800, 900, false],
] as const

describe('Fyther production assets', () => {
  it.each(assets)('%s has the approved dimensions and transparency', async (file, width, height, alpha) => {
    const path = resolve(process.cwd(), 'public', file)
    const metadata = await sharp(path).metadata()
    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(width)
    expect(metadata.height).toBe(height)
    expect(Boolean(metadata.hasAlpha)).toBe(alpha)
    expect(statSync(path).size).toBeLessThan(alpha ? 500_000 : 700_000)
  })
})
```

- [ ] **Step 2: Run the asset test and verify the failure**

Run: `npm test -- tests/assets.test.ts`

Expected: FAIL with missing approved asset paths.

- [ ] **Step 3: Create the deterministic Sharp preparation script**

Create `scripts/prepare-fyther-assets.mjs` with this public interface:

```js
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'

const root = process.cwd()

export async function prepareRaster(input, output, width, height, position = 'centre') {
  const target = resolve(root, output)
  await mkdir(dirname(target), { recursive: true })
  await sharp(resolve(root, input))
    .resize(width, height, { fit: 'cover', position })
    .webp({ quality: 84, effort: 6 })
    .toFile(target)
}

export async function prepareTransparentMark(input, output, size) {
  const source = sharp(resolve(root, input)).ensureAlpha()
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true })
  const [cornerR, cornerG, cornerB] = data
  for (let index = 0; index < data.length; index += info.channels) {
    const distance = Math.hypot(
      data[index] - cornerR,
      data[index + 1] - cornerG,
      data[index + 2] - cornerB,
    )
    data[index + 3] = distance < 28 ? 0 : Math.min(255, Math.round((distance - 28) * 10))
  }
  const target = resolve(root, output)
  await mkdir(dirname(target), { recursive: true })
  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(target)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await Promise.all([
    prepareTransparentMark('public/logo1.png', 'public/brand/fyther-mark-header.webp', 640),
    prepareTransparentMark('public/logo2.png', 'public/brand/fyther-mark-footer.webp', 960),
    prepareRaster('public/home.jpeg', 'public/editorial/hero-poster-desktop.webp', 2400, 1350, 'centre'),
    prepareRaster('public/home.jpeg', 'public/editorial/hero-poster-mobile.webp', 1200, 1500, 'attention'),
    prepareRaster('.superpowers/generated-assets/collection-ropa.png', 'public/editorial/collection-ropa.webp', 1600, 2000),
    prepareRaster('.superpowers/generated-assets/collection-accesorios.png', 'public/editorial/collection-accesorios.webp', 1600, 2000),
    prepareRaster('.superpowers/generated-assets/community-movement.png', 'public/editorial/community-movement.webp', 2000, 1200),
    prepareRaster('.superpowers/generated-assets/footer-movement.png', 'public/editorial/footer-movement.webp', 1800, 900, 'entropy'),
  ])
}
```

Use temporary generated source files under `.superpowers/generated-assets/`, which is already ignored through `.superpowers/`.

- [ ] **Step 4: Generate source photography and extract video posters**

Use the `imagegen` skill for four editorial images with these exact constraints:

```text
Fyther Store editorial photography, premium women's activewear boutique in Costa Rica,
dark neutral studio, cyan edge light and one restrained pink accent, realistic adult women,
warm friendship and confident movement, sophisticated sports magazine composition,
no text, no logos, no visible trademarks, no invented purchasable product, realistic anatomy.
```

Apply these compositions:

- Ropa: vertical activewear flat lay with generous negative space.
- Accesorios: vertical sports organization and movement accessories.
- Community: wide social training moment with two or three adult women.
- Footer: wide calm post-workout scene with negative space on the right.

Use `public/home.jpeg`, the existing first stable frame of `public/video-presentacion.mp4`, as the source for both hero posters. Run the preparation script to create all final outputs, including transparent marks derived from `public/logo1.png` and `public/logo2.png`.

- [ ] **Step 5: Inspect and test every asset**

Open all eight assets with `view_image`. Reject any visible logo residue, false transparent halo, malformed anatomy, embedded text, dark blank crop or covered focal subject.

Run: `node scripts/prepare-fyther-assets.mjs && npm test -- tests/assets.test.ts`

Expected: eight asset assertions PASS and every file remains below its declared limit.

- [ ] **Step 6: Commit the asset pipeline and outputs**

```bash
git add scripts/prepare-fyther-assets.mjs tests/assets.test.ts public/brand public/editorial
git commit -m "feat: add Fyther editorial asset system"
```

---

### Task 3: Establish the Soft Performance Design Tokens

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `tests/smoke.test.ts`
- Modify: `tests/metadata.test.ts`

- [ ] **Step 1: Write failing token and metadata assertions**

Add to `tests/smoke.test.ts`:

```ts
expect(globalsCss).toContain('--radius-editorial: 24px')
expect(globalsCss).toContain('--radius-product: 14px')
expect(globalsCss).toContain('--radius-control: 999px')
expect(globalsCss).toContain('--motion-enter: 360ms')
```

Update `tests/metadata.test.ts` to expect `/editorial/hero-poster-desktop.webp` with dimensions `2400 × 1350`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- tests/smoke.test.ts tests/metadata.test.ts`

Expected: FAIL because the approved tokens and Open Graph image are not configured.

- [ ] **Step 3: Add the approved token layer**

Add to `:root` in `app/globals.css`:

```css
--radius-editorial: 24px;
--radius-editorial-tight: 8px;
--radius-product: 14px;
--radius-panel: 12px;
--radius-control: 999px;
--motion-press: 150ms;
--motion-enter: 360ms;
--motion-stagger: 80ms;
--shadow-soft: 0 18px 48px rgba(0, 0, 0, 0.22);
```

Replace hard-coded 4 px and 8 px radii on controls, fields, summaries and commerce panels with the appropriate token. Keep layout dimensions stable and reserve capsules for buttons, filters and the header.

- [ ] **Step 4: Update metadata and verify tokens**

Change the Open Graph image in `app/layout.tsx`:

```ts
images: [{
  url: '/editorial/hero-poster-desktop.webp',
  width: 2400,
  height: 1350,
  alt: 'Fyther Store, movimiento y ropa deportiva femenina',
}],
```

Run: `npm test -- tests/smoke.test.ts tests/metadata.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the design foundation**

```bash
git add app/globals.css app/layout.tsx tests/smoke.test.ts tests/metadata.test.ts
git commit -m "style: establish soft performance design tokens"
```

---

### Task 4: Redesign Brand Mark, Header and Footer

**Files:**
- Modify: `components/BrandMark.tsx`
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`
- Modify: `tests/components/brand-mark.test.tsx`
- Modify: `tests/components/header.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing navigation and asset tests**

Update component tests to assert:

```ts
expect(homeLink.querySelector('img')?.getAttribute('src')).toContain('fyther-mark-header.webp')
expect(screen.getByRole('link', { name: 'Seguir pedido' })).toHaveAttribute('href', '/envios-apartados')
expect(screen.getByText('Productos originales')).toBeInTheDocument()
expect(screen.getByText('Respuesta en menos de 24 horas')).toBeInTheDocument()
expect(screen.getByRole('link', { name: 'fytherstore@gmail.com' })).toHaveAttribute(
  'href',
  'mailto:fytherstore@gmail.com',
)
```

Add a scroll-state test that stubs `window.scrollY` at `64`, dispatches `scroll`, advances one animation frame and expects `.site-header` to have class `is-scrolled`.

- [ ] **Step 2: Run the header tests and verify failure**

Run: `npm test -- tests/components/brand-mark.test.tsx tests/components/header.test.tsx`

Expected: FAIL for new assets, tracking link, compact state and footer trust content.

- [ ] **Step 3: Update the brand and navigation components**

Map variants in `BrandMark.tsx`:

```ts
const sources = {
  primary: '/brand/fyther-mark-header.webp',
  alternate: '/brand/fyther-mark-footer.webp',
} as const
```

In `Header.tsx`, add `scrolled` state and a passive `scroll` listener guarded by one `requestAnimationFrame`. Set `scrolled` from `window.scrollY > 40`, cancel the frame on cleanup and render:

```tsx
<header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
```

Add `<Link href="/envios-apartados">Seguir pedido</Link>` to desktop and mobile navigation. That page already explains that each confirmation includes a unique tracking link. Preserve Escape close, focus return, body lock and automatic close at the desktop breakpoint.

In `Footer.tsx`, use `next/image` for `/editorial/footer-movement.webp`, keep all current legal links, add Tracking and render trust items as plain text:

```tsx
<ul className="footer-trust" aria-label="Servicio Fyther">
  <li>Productos originales</li>
  <li>Correos de Costa Rica</li>
  <li>Sinpe y apartados</li>
  <li>Respuesta en menos de 24 horas</li>
</ul>
```

- [ ] **Step 4: Apply responsive shell styles**

Use a 24 px outer radius for the footer media, 14 px for the mobile menu, a capsule header, 44 px icon buttons and 48 px mobile menu links. The scrolled header may reduce internal logo scale, but `.header-inner` must retain a stable minimum height and the page must not move when the class changes.

- [ ] **Step 5: Run component tests and inspect both breakpoints**

Run: `npm test -- tests/components/brand-mark.test.tsx tests/components/header.test.tsx && npm run typecheck`

Expected: PASS. Inspect at 390 px and 1440 px; the header must not cover headings and the footer must not clip email or legal links.

- [ ] **Step 6: Commit the shell redesign**

```bash
git add components/BrandMark.tsx components/Header.tsx components/Footer.tsx app/globals.css tests/components/brand-mark.test.tsx tests/components/header.test.tsx
git commit -m "feat: redesign Fyther navigation and footer"
```

---

### Task 5: Build the Monotonic Hero Scroll Model

**Files:**
- Create: `lib/hero-scroll.ts`
- Create: `tests/hero-scroll.test.ts`

- [ ] **Step 1: Write the failing pure-function tests**

Create `tests/hero-scroll.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getHeroFrame } from '@/lib/hero-scroll'

describe('getHeroFrame', () => {
  it('maps a short scroll journey to a video cut one second before the end', () => {
    expect(getHeroFrame({ scrollY: 750, start: 0, travel: 1500, duration: 8, previousProgress: 0 }))
      .toEqual({ progress: 0.5, currentTime: 3.5, complete: false })
    expect(getHeroFrame({ scrollY: 1500, start: 0, travel: 1500, duration: 8, previousProgress: 0 }))
      .toEqual({ progress: 1, currentTime: 7, complete: true })
  })

  it('clamps before and after the journey', () => {
    expect(getHeroFrame({ scrollY: -20, start: 0, travel: 1000, duration: 8, previousProgress: 0 }).progress).toBe(0)
    expect(getHeroFrame({ scrollY: 2000, start: 0, travel: 1000, duration: 8, previousProgress: 0 }).progress).toBe(1)
  })

  it('never rewinds after progress has been observed', () => {
    expect(getHeroFrame({ scrollY: 200, start: 0, travel: 1000, duration: 8, previousProgress: 0.7 }).progress).toBe(0.7)
  })

  it('handles missing metadata without invalid time values', () => {
    expect(getHeroFrame({ scrollY: 500, start: 0, travel: 1000, duration: 0, previousProgress: 0.2 }))
      .toEqual({ progress: 0.5, currentTime: 0, complete: false })
  })
})
```

- [ ] **Step 2: Run the test and verify module failure**

Run: `npm test -- tests/hero-scroll.test.ts`

Expected: FAIL because `lib/hero-scroll.ts` does not exist.

- [ ] **Step 3: Implement the pure model**

Create `lib/hero-scroll.ts`:

```ts
export interface HeroFrameInput {
  scrollY: number
  start: number
  travel: number
  duration: number
  previousProgress: number
}

export interface HeroFrame {
  progress: number
  currentTime: number
  complete: boolean
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function getHeroFrame(input: HeroFrameInput): HeroFrame {
  const travel = Math.max(1, input.travel)
  const rawProgress = clamp((input.scrollY - input.start) / travel)
  const progress = Math.max(clamp(input.previousProgress), rawProgress)
  const cutTime = Math.max(0, input.duration - 1)
  return {
    progress,
    currentTime: cutTime * progress,
    complete: progress === 1,
  }
}
```

- [ ] **Step 4: Run the unit test**

Run: `npm test -- tests/hero-scroll.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit the scroll model**

```bash
git add lib/hero-scroll.ts tests/hero-scroll.test.ts
git commit -m "feat: add monotonic hero scroll model"
```

---

### Task 6: Implement the Scroll-Controlled Hero

**Files:**
- Modify: `components/site/HeroMedia.tsx`
- Modify: `tests/components/hero-media.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace autoplay expectations with scrub expectations**

Update `tests/components/hero-media.test.tsx` so it asserts:

```ts
expect(container.querySelector('video')).not.toHaveAttribute('loop')
expect((container.querySelector('video') as HTMLVideoElement).muted).toBe(true)
expect(container.querySelector('.hero-journey')).toHaveAttribute('data-hero-complete', 'false')
expect(screen.getByRole('img', { name: 'Fyther Store, entrada a la colección' }).getAttribute('src'))
  .toContain('hero-poster-desktop.webp')
```

Stub `getBoundingClientRect()`, `duration = 8`, `window.scrollY` and `requestAnimationFrame`; dispatch scroll and assert `video.currentTime` becomes `7` at completion. Assert scrolling backward does not reduce it. Keep the existing reduced-motion and data-saver assertions, but expect no video element in those states.

- [ ] **Step 2: Run the hero tests and verify failure**

Run: `npm test -- tests/components/hero-media.test.tsx`

Expected: FAIL because the component still autoplays and loops through an IntersectionObserver.

- [ ] **Step 3: Replace autoplay with a single rAF scroll controller**

In `HeroMedia.tsx`:

- Import `getHeroFrame`.
- Keep reduced-motion and data-saver listeners.
- Remove `IntersectionObserver` and calls to `video.play()`.
- On `loadedmetadata`, scroll and resize, request one animation frame.
- Calculate travel as `section.offsetHeight - window.innerHeight`.
- Store the highest progress in a ref.
- Set `video.currentTime`, `--hero-progress` and `data-hero-complete`.
- Cancel the frame and listeners on cleanup.
- Render `<video muted playsInline preload="metadata" poster="/editorial/hero-poster-desktop.webp">` without `autoPlay` or `loop`.
- Render desktop and mobile poster sources with `<picture>` before the video so the first viewport never starts blank.

The section markup must expose:

```tsx
<section
  id="descubrir"
  ref={journeyRef}
  className="hero-journey"
  data-scene="hero"
  data-hero-complete={complete}
  style={{ '--hero-progress': progress } as React.CSSProperties}
>
```

- [ ] **Step 4: Add the approved responsive journey CSS**

```css
.hero-journey { position: relative; min-height: 150svh; }
.hero-section { position: sticky; top: 0; min-height: 100svh; overflow: clip; }
.hero-content { opacity: calc(1 - min(1, var(--hero-progress) * 2.8)); }
.hero-media { transform: scale(calc(1 + var(--hero-progress) * 0.035)); }
.hero-journey[data-hero-complete='true'] .hero-category-cue { opacity: 1; transform: translateY(0); }

@media (max-width: 767px) {
  .hero-journey { min-height: 120svh; }
  .hero-section { min-height: 84svh; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-journey { min-height: auto; }
  .hero-section { position: relative; min-height: 84svh; }
  .hero-content, .hero-media { opacity: 1; transform: none; }
}
```

Use an equivalent clamped custom-property expression if the browser matrix rejects `min()` inside `calc()`.

- [ ] **Step 5: Run hero tests and inspect the actual video cut**

Run: `npm test -- tests/hero-scroll.test.ts tests/components/hero-media.test.tsx && npm run typecheck`

Expected: PASS. Start the dev server and confirm through browser inspection that `currentTime` ends within `±0.15s` of `duration - 1` and never loops.

- [ ] **Step 6: Commit the hero journey**

```bash
git add components/site/HeroMedia.tsx lib/hero-scroll.ts tests/components/hero-media.test.tsx app/globals.css
git commit -m "feat: add scroll-controlled Fyther hero"
```

---

### Task 7: Rebuild the Home Shopping Journey

**Files:**
- Create: `components/site/FaqAccordion.tsx`
- Create: `tests/components/faq-accordion.test.tsx`
- Modify: `components/site/MotionTrack.tsx`
- Modify: `components/site/CollectionWorlds.tsx`
- Modify: `components/site/CollectionSection.tsx`
- Modify: `components/site/EditorialStory.tsx`
- Modify: `components/site/TrustFaq.tsx`
- Modify: `app/page.tsx`
- Modify: `lib/home-selection.ts`
- Modify: `tests/home-selection.test.ts`
- Modify: `tests/components/home-page.test.tsx`
- Modify: `tests/components/home-scenes.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing home and FAQ tests**

Add tests for four-item selection:

```ts
expect(selectHomeProducts([
  product('one'), product('two'), product('three'), product('four'), product('five'),
], 4).map(({ id }) => id)).toEqual(['one', 'two', 'three', 'four'])
```

Create `tests/components/faq-accordion.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import FaqAccordion from '@/components/site/FaqAccordion'

it('keeps only one answer open', async () => {
  const user = userEvent.setup()
  render(<FaqAccordion items={[
    { question: 'Primera', answer: 'Respuesta uno' },
    { question: 'Segunda', answer: 'Respuesta dos' },
  ]} />)
  await user.click(screen.getByRole('button', { name: 'Primera' }))
  expect(screen.getByText('Respuesta uno')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Segunda' }))
  expect(screen.queryByText('Respuesta uno')).not.toBeInTheDocument()
  expect(screen.getByText('Respuesta dos')).toBeVisible()
})
```

Update home tests to require `/editorial/collection-ropa.webp`, `/editorial/collection-accesorios.webp`, `/editorial/community-movement.webp`, two category portals, two independent product sections and the approved trust phrases.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- tests/home-selection.test.ts tests/components/faq-accordion.test.tsx tests/components/home-page.test.tsx tests/components/home-scenes.test.tsx`

Expected: FAIL for the four-item cap, missing accordion and new asset paths.

- [ ] **Step 3: Implement the exclusive accordion**

Create `FaqAccordion.tsx` as a client component with `openIndex: number | null`. Each question is a `<button aria-expanded aria-controls>` and each answer has `role="region" aria-labelledby`; closed answers are not rendered. `TrustFaq.tsx` owns the five approved content objects and passes them to `FaqAccordion`.

- [ ] **Step 4: Update selection and home components**

Change `selectHomeProducts()` to bound `limit` at four. Update the category image paths, preserve real accessory tag filters and use `selectHomeProducts(ropa, 4)` plus `selectHomeProducts(accesorios, 4)` in `app/page.tsx`.

`CollectionSection` must:

- Render 4/3/2 columns above 768 px.
- Render a 72% native rail below 560 px.
- Preserve DOM product order.
- Keep the final category link outside the rail.
- Keep honest empty states.

`EditorialStory` uses `/editorial/community-movement.webp`; `MotionTrack` renders four stable list items instead of one uninterrupted sentence. No continuous marquee animation is added.

- [ ] **Step 5: Apply the editorial soft geometry**

Use complementary category radii:

```css
.collection-world-panel:first-child .collection-world-media {
  border-radius: var(--radius-editorial) var(--radius-editorial-tight) var(--radius-editorial) var(--radius-editorial);
}
.collection-world-panel:last-child .collection-world-media {
  border-radius: var(--radius-editorial-tight) var(--radius-editorial) var(--radius-editorial) var(--radius-editorial);
}
```

At mobile breakpoints, return both category cards to `var(--radius-editorial)` and use native scroll snap. Product cards use `var(--radius-product)` and the editorial story remains an unframed full-width composition.

- [ ] **Step 6: Run home tests and verify responsive DOM contracts**

Run: `npm test -- tests/home-selection.test.ts tests/components/faq-accordion.test.tsx tests/components/home-page.test.tsx tests/components/home-scenes.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the home journey**

```bash
git add app/page.tsx app/globals.css components/site lib/home-selection.ts tests/home-selection.test.ts tests/components
git commit -m "feat: rebuild Fyther home shopping journey"
```

---

### Task 8: Refine Product Cards and Catalog Discovery

**Files:**
- Modify: `components/ProductCard.tsx`
- Modify: `app/catalogo/CatalogClient.tsx`
- Modify: `tests/components/product-card.test.tsx`
- Modify: `tests/components/catalog-client.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing product and search tests**

Add to product card tests:

```tsx
expect(screen.getByText('Nike')).toBeInTheDocument()
expect(screen.getByText('₡25 000')).toBeInTheDocument()
expect(screen.getByText('₡30 000')).toHaveClass('product-compare-price')
```

Use a fixture with `brand: 'Nike'`, `price.amount: 25000` and `compareAtPrice.amount: 30000`. Add a catalog test that searches `alo` and expects only the product whose `brand` is `Alo`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- tests/components/product-card.test.tsx tests/components/catalog-client.test.tsx`

Expected: FAIL because cards omit brand and comparison price, and catalog search omits brand.

- [ ] **Step 3: Implement truthful product metadata**

In `ProductCard.tsx`, show `product.brand ?? product.category`. Render comparison price only when `compareAtPrice` is non-null. Replace the `<article>` root with one `<Link href={`/catalogo/${product.slug}`} className="product-card">` that contains image, copy, prices and a non-interactive action label. Use `<span className="product-action product-action-disabled">Agotado</span>` for sold-out products and `<span className="product-action">Ver producto</span>` otherwise. Do not place buttons or nested links inside the card.

In `CatalogClient.tsx`, define searchable content as:

```ts
const searchable = [
  product.name,
  product.brand ?? '',
  product.shortDescription ?? '',
  ...product.tags,
].join(' ').toLocaleLowerCase('es')
```

- [ ] **Step 4: Apply catalog and card styles**

Use stable 4:5 media, `var(--radius-product)`, a compact metadata row and tabular prices. Preserve the existing hover scale at `1.025` and keyboard parity. Filters remain capsules; search and sort fields use `var(--radius-panel)`.

- [ ] **Step 5: Run focused and interaction tests**

Run: `npm test -- tests/components/product-card.test.tsx tests/components/catalog-client.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit catalog refinement**

```bash
git add components/ProductCard.tsx app/catalogo/CatalogClient.tsx app/globals.css tests/components/product-card.test.tsx tests/components/catalog-client.test.tsx
git commit -m "feat: refine product discovery and brand display"
```

---

### Task 9: Apply the System to Detail, Cart and Checkout

**Files:**
- Modify: `app/catalogo/[slug]/ProductDetail.tsx`
- Modify: `app/carrito/page.tsx`
- Modify: `app/checkout/CheckoutClient.tsx`
- Modify: `tests/components/product-detail.test.tsx`
- Modify: `tests/components/cart.test.tsx`
- Modify: `tests/components/checkout.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add failing presentation assertions without changing commerce behavior**

Update tests to assert the detail renders brand above product name, variant buttons expose `aria-pressed`, quantity controls retain accessible names, checkout errors remain attached by `aria-describedby`, and the order summary has class `commerce-summary-panel`.

Use this exact detail assertion:

```tsx
expect(screen.getByText('Nike')).toHaveClass('detail-brand')
expect(screen.getByRole('button', { name: 'Talla M' })).toHaveAttribute('aria-pressed', 'true')
```

- [ ] **Step 2: Run commerce component tests and verify failure**

Run: `npm test -- tests/components/product-detail.test.tsx tests/components/cart.test.tsx tests/components/checkout.test.tsx`

Expected: FAIL only for new presentation contracts; existing checkout behavior must remain green.

- [ ] **Step 3: Update semantic wrappers and brand output**

Render `product.brand` as `.detail-brand` when present. Add `.commerce-summary-panel` to cart and checkout summaries. Do not alter `createOrder`, idempotency keys, inventory checks, variant IDs, payment method values or router destinations.

- [ ] **Step 4: Apply responsive commerce styles**

- Detail: two columns above 900 px, one column below; media uses 4:5 and 24 px radius.
- Variant and quantity controls: minimum 44 px and 12 px radius.
- Cart and checkout summaries: 12 px radius, sticky only when viewport height allows it.
- Forms: 12 px fields, visible focus, errors directly below fields.
- Mobile checkout CTA: full width without fixed overlay.

- [ ] **Step 5: Run commerce unit and component suites**

Run: `npm test -- tests/components/product-detail.test.tsx tests/components/cart.test.tsx tests/components/checkout.test.tsx tests/actions/checkout.test.ts tests/commerce/checkout.test.ts`

Expected: PASS with no commerce logic regressions.

- [ ] **Step 6: Commit transactional surface styling**

```bash
git add app/catalogo/[slug]/ProductDetail.tsx app/carrito/page.tsx app/checkout/CheckoutClient.tsx app/globals.css tests/components
git commit -m "style: align detail cart and checkout surfaces"
```

---

### Task 10: Align Confirmation, Tracking, Policies and Recovery States

**Files:**
- Modify: `components/commerce/OrderPresentation.tsx`
- Modify: `components/commerce/CommerceState.tsx`
- Modify: `components/site/PolicyPage.tsx`
- Modify: `app/error.tsx`
- Modify: `app/not-found.tsx`
- Modify: `tests/components/order-presentation.test.tsx`
- Modify: `tests/components/commerce-state.test.tsx`
- Modify: `tests/components/policy-page.test.tsx`
- Modify: `tests/components/recovery-pages.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add failing consistency assertions**

Require each status page to expose one visible `h1`, one primary action, a `.status-surface` wrapper and no internal configuration language. Keep tests that prohibit `cambios` and `devoluciones`.

```tsx
expect(container.querySelector('.status-surface')).toBeInTheDocument()
expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- tests/components/order-presentation.test.tsx tests/components/commerce-state.test.tsx tests/components/policy-page.test.tsx tests/components/recovery-pages.test.tsx`

Expected: FAIL for the new shared wrapper.

- [ ] **Step 3: Apply shared status and reading surfaces**

Add `.status-surface` to confirmation, tracking, commerce-unavailable, error and not-found roots. Preserve all existing order IDs, statuses, tracking events and links. Policy content remains unframed with constrained reading width; do not wrap every policy section in a card.

- [ ] **Step 4: Apply calm responsive styles**

Use `var(--radius-panel)` only on status panels and order summaries. Policy headings use context-sized typography, paragraphs remain at 62–68 characters and all links retain 44 px targets on mobile.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- tests/components/order-presentation.test.tsx tests/components/commerce-state.test.tsx tests/components/policy-page.test.tsx tests/components/recovery-pages.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit secondary page alignment**

```bash
git add components/commerce components/site/PolicyPage.tsx app/error.tsx app/not-found.tsx app/globals.css tests/components
git commit -m "style: align Fyther status and policy pages"
```

---

### Task 11: Complete Responsive, Accessibility and Production Verification

**Files:**
- Modify: `e2e/store.spec.ts`
- Modify: `app/globals.css`
- Modify: `README.md`

- [ ] **Step 1: Add failing E2E contracts for the redesigned journey**

Extend `e2e/store.spec.ts` to verify:

```ts
await expect(page.locator('.hero-journey')).toHaveAttribute('data-hero-complete', 'false')
await page.evaluate(() => window.scrollTo(0, document.querySelector('.hero-journey')!.scrollHeight))
await expect(page.locator('.hero-journey')).toHaveAttribute('data-hero-complete', 'true')
await expect(page.locator('.collection-world-panel')).toHaveCount(2)
await expect(page.locator('#ropa .product-card')).toHaveCount(0)
await expect(page.getByRole('heading', { name: 'Estamos preparando esta selección.' })).toBeVisible()
await expect(page.locator('#accesorios .product-card')).toHaveCount(3)
```

Keep the configured fixture at zero Ropa products and three Accesorios products so the matrix verifies both an honest empty collection and a populated collection. Add checks that the hero video has no `loop`, that its final time is within `0.15s` of `duration - 1`, and that scrolling upward does not lower `currentTime`.

Keep the existing matrix: 390 × 844, 768 × 1024, 1440 × 900 and unconfigured desktop.

- [ ] **Step 2: Run E2E and capture the first failures**

Run: `npm run test:e2e`

Expected: failures identify stale selectors, visual containment or motion assumptions; no server cleanup leak is acceptable.

- [ ] **Step 3: Fix only verified responsive and accessibility defects**

Check and correct:

- Header, hero text, categories, rails, FAQ and footer at all three viewports.
- 200% text zoom with no horizontal page scroll.
- Keyboard focus order through menu, category links, products, FAQ and footer.
- Reduced motion with no scrub, clip or transform longer than 150 ms.
- Save-data fallback with no `<video>`.
- Product card hover and focus parity without geometry changes.
- Checkout and tracking behavior in configured mode.
- Honest no-catalog state in unconfigured mode.

- [ ] **Step 4: Run the complete quality suite**

Run commands separately so failures remain attributable:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm run test:e2e
```

Expected:

- ESLint: 0 errors.
- TypeScript: 0 errors.
- Vitest: all tests PASS.
- Next build: all routes compile.
- Audit: 0 high or critical vulnerabilities.
- Playwright: all applicable projects PASS; skips are only intentional project guards.

- [ ] **Step 5: Perform browser verification and pixel checks**

Start the local production server and use the browser verification skill. Capture full-page desktop, tablet and mobile screenshots. Inspect canvas/video pixels at the start and final hero frames to confirm they are nonblank. Confirm there are no overlaps, clipped labels, empty media, body-level horizontal scroll or unexpected console errors.

- [ ] **Step 6: Update operational documentation**

Add to `README.md`:

- BilBildin brand source: `products.attributes.brand`.
- Asset preparation command: `node scripts/prepare-fyther-assets.mjs`.
- Hero fallbacks for reduced motion and data saver.
- Required Vercel Preview validation before Production.

- [ ] **Step 7: Request independent review and fix actionable findings**

Use `requesting-code-review` against the spec and this plan. Address every confirmed P0–P2 finding, rerun the affected test first, then rerun the complete suite.

- [ ] **Step 8: Commit final verification changes**

```bash
git add e2e/store.spec.ts app/globals.css README.md
git commit -m "test: verify soft performance storefront"
```

- [ ] **Step 9: Publish the completed branch**

Verify `git status --short` is empty, then:

```bash
git push origin codex/fyther-v1-impl
```

Confirm the remote branch points to the final verified commit. Validate the resulting Vercel Preview with real environment variables, then promote only after catalog, stock, variants, checkout and tracking pass against the Fyther tenant.
