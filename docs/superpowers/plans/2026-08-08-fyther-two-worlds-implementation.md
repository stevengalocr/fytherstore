# Fyther Two-World Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Fyther's storefront around two truthful shopping worlds, Ropa and Accesorios, with real Supabase inventory, a polished editorial home, accurate service copy, and production-ready responsive behavior.

**Architecture:** Server-side home data is normalized and split by exact category before rendering reusable world and collection sections. Catalog filters share the same normalizer so category URLs remain truthful even when one collection is empty. Existing commerce, cart, checkout, order confirmation, and tracking stay intact while navigation, FAQ, policy routes, and CSS are refactored around the new information architecture.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase/BilBildin commerce adapter, Lucide React, Vitest, Testing Library, Playwright, Vercel.

---

## File Structure

- Create `components/site/CollectionWorlds.tsx`: two-world category chooser.
- Create `components/site/CollectionSection.tsx`: reusable real-product/empty-state section.
- Create `app/envios-apartados/page.tsx`: truthful shipping and layaway policy.
- Modify `lib/home-selection.ts`: shared category normalization and split logic.
- Modify `app/page.tsx`: assemble the new home architecture.
- Modify `app/catalogo/CatalogClient.tsx`: enforce the two canonical category filters.
- Modify `components/site/EditorialStory.tsx`: transitional editorial scene without a generic final CTA.
- Modify `components/site/HeroMedia.tsx`: direct visitors into the two worlds.
- Modify `components/site/MotionTrack.tsx`: factual service ribbon.
- Modify `components/site/TrustFaq.tsx`: five-item accessible FAQ.
- Modify `components/Header.tsx` and `components/Footer.tsx`: two-world navigation and corrected policy link.
- Modify `app/envios-cambios/page.tsx`: permanent redirect to the corrected policy route.
- Modify `app/sitemap.ts`: publish the corrected route.
- Modify `app/globals.css`: complete responsive visual and motion treatment.
- Modify unit and browser tests listed below.
- Delete `components/site/CategoryRail.tsx`, `components/site/FinalGlow.tsx`, and `components/commerce/ProductGrid.tsx` after replacements are covered.

### Task 1: Canonical Product Worlds

**Files:**
- Modify: `lib/home-selection.ts`
- Modify: `tests/home-selection.test.ts`

- [ ] **Step 1: Write failing category tests**

Add tests that call `normalizeCollectionCategory` and `splitProductsByWorld`:

```ts
expect(normalizeCollectionCategory('  Accesórios ')).toBe('accesorios')
expect(normalizeCollectionCategory('ROPA')).toBe('ropa')
expect(normalizeCollectionCategory(null)).toBe('')

const result = splitProductsByWorld([
  product('top', false, 'Ropa'),
  product('rack', false, 'Accesorios'),
  product('other', false, 'Running'),
])
expect(result.ropa.map(({ id }) => id)).toEqual(['top'])
expect(result.accesorios.map(({ id }) => id)).toEqual(['rack'])
```

Extend the test product helper with `category: string | null = null`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/home-selection.test.ts`

Expected: FAIL because both exports are missing.

- [ ] **Step 3: Implement exact normalization and splitting**

Add to `lib/home-selection.ts`:

```ts
export type CollectionWorld = 'ropa' | 'accesorios'

export function normalizeCollectionCategory(category: string | null | undefined): string {
  return (category ?? '')
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function splitProductsByWorld(products: CommerceProduct[]): Record<CollectionWorld, CommerceProduct[]> {
  return products.reduce<Record<CollectionWorld, CommerceProduct[]>>((worlds, product) => {
    const category = normalizeCollectionCategory(product.category)
    if (category === 'ropa' || category === 'accesorios') worlds[category].push(product)
    return worlds
  }, { ropa: [], accesorios: [] })
}
```

Keep `selectHomeProducts` unchanged because existing callers/tests may still rely on it until Task 2 removes its home use.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- tests/home-selection.test.ts`

Expected: all home-selection tests pass.

- [ ] **Step 5: Commit**

```powershell
git add lib/home-selection.ts tests/home-selection.test.ts
git commit -m "feat: split products into Fyther worlds"
```

### Task 2: Two-World Home Components

**Files:**
- Create: `components/site/CollectionWorlds.tsx`
- Create: `components/site/CollectionSection.tsx`
- Modify: `components/site/EditorialStory.tsx`
- Modify: `tests/components/home-scenes.test.tsx`
- Delete: `components/site/CategoryRail.tsx`
- Delete: `components/site/FinalGlow.tsx`
- Delete: `components/commerce/ProductGrid.tsx`

- [ ] **Step 1: Replace old scene tests with failing two-world contracts**

Test these public behaviors:

```tsx
render(<CollectionWorlds ropaAvailable={false} accesoriosAvailable />)
expect(screen.getByRole('heading', { name: 'Dos formas de acompañar tu movimiento.' })).toBeInTheDocument()
expect(screen.getByRole('link', { name: /descubrir ropa/i })).toHaveAttribute('href', '#ropa')
expect(screen.getByRole('link', { name: /ver accesorios/i })).toHaveAttribute('href', '#accesorios')
expect(screen.getByText('Próximamente')).toBeInTheDocument()

render(<CollectionSection id="ropa" eyebrow="ROPA" title="Ropa para sentirte tú." products={[]} emptyTitle="Estamos preparando esta selección." emptyCopy="Muy pronto encontrarás prendas elegidas para moverte a tu manera." />)
expect(screen.getByRole('heading', { name: 'Estamos preparando esta selección.' })).toBeInTheDocument()
expect(screen.queryByRole('article')).not.toBeInTheDocument()

render(<CollectionSection id="accesorios" eyebrow="ACCESORIOS" title="Detalles que siguen tu ritmo." products={[product('rack', 'Rack')]} emptyTitle="" emptyCopy="" />)
expect(screen.getAllByRole('article')).toHaveLength(1)
expect(screen.getByText('Rack')).toBeInTheDocument()
```

Update the editorial assertion to the approved transition copy and assert there is no generic “Ver la colección” link. Remove all `CategoryRail`, `FinalGlow`, and `ProductGrid` tests/imports.

- [ ] **Step 2: Run the focused component test and verify RED**

Run: `npm test -- tests/components/home-scenes.test.tsx`

Expected: FAIL because `CollectionWorlds` and `CollectionSection` do not exist.

- [ ] **Step 3: Implement `CollectionWorlds`**

Render a `section.collection-worlds` with heading, two equal `Link` panels, stable image wrappers, `/ropa.png` for Ropa, `/modelo2.png` for Accesorios, and availability-aware supporting labels. Use `ArrowDownRight`; image `alt` values describe the visible scenes and `sizes="(max-width: 767px) calc(100vw - 32px), 50vw"`.

- [ ] **Step 4: Implement `CollectionSection`**

Use this interface:

```ts
interface CollectionSectionProps {
  id: 'ropa' | 'accesorios'
  eyebrow: string
  title: string
  description: string
  products: CommerceProduct[]
  emptyTitle: string
  emptyCopy: string
}
```

Render `ProductCard` for every supplied product using stable home image sizes. When empty, render `.collection-empty` with only the supplied factual copy and no product cards, prices, or stock claims. Include a category-specific catalog link only when products exist.

- [ ] **Step 5: Refactor the editorial transition and remove retired components**

Keep `/modelo1.png`, change the scene to `id="fyther"`, eyebrow `A TU MANERA`, title `Tu rutina también vive en los detalles.`, and copy `Lo que eliges para moverte puede sentirse cercano, útil y muy tuyo.` Remove its catalog link. Delete the three retired component files.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- tests/components/home-scenes.test.tsx`

Expected: all scene tests pass.

- [ ] **Step 7: Commit**

```powershell
git add components/site components/commerce/ProductGrid.tsx tests/components/home-scenes.test.tsx
git commit -m "feat: add Ropa and Accesorios home worlds"
```

### Task 3: Home, Catalog, and Navigation Integration

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/catalogo/CatalogClient.tsx`
- Modify: `components/site/HeroMedia.tsx`
- Modify: `components/site/MotionTrack.tsx`
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`
- Modify: `tests/components/catalog-client.test.tsx`
- Modify: `tests/components/header.test.tsx`
- Modify: `tests/components/hero-media.test.tsx`

- [ ] **Step 1: Write failing catalog and navigation tests**

Add a catalog test that renders real Accesorios plus no Ropa, starts with `initialCategory="Ropa"`, expects the Ropa filter pressed, zero results, and no accessory product. Update header expectations to links named `Ropa` and `Accesorios` with filtered catalog URLs. Update hero expectations to two actions targeting `#ropa` and `#accesorios`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- tests/components/catalog-client.test.tsx tests/components/header.test.tsx tests/components/hero-media.test.tsx`

Expected: FAIL on the missing canonical filters and old navigation/actions.

- [ ] **Step 3: Integrate server-rendered home worlds**

In `app/page.tsx`, call `splitProductsByWorld(products)` and render in this order:

```tsx
<HeroMedia />
<MotionTrack />
<CollectionWorlds ropaAvailable={ropa.length > 0} accesoriosAvailable={accesorios.length > 0} />
<CollectionSection id="ropa" eyebrow="ROPA" title="Ropa para sentirte tú." description="Prendas elegidas para entrenar, caminar y compartir tu ritmo." products={ropa} emptyTitle="Estamos preparando esta selección." emptyCopy="Muy pronto encontrarás prendas elegidas para moverte a tu manera." />
<EditorialStory />
<CollectionSection id="accesorios" eyebrow="ACCESORIOS" title="Detalles que siguen tu ritmo." description="Accesorios originales y útiles para organizar, celebrar y acompañar cada meta." products={accesorios} emptyTitle="Estamos preparando los detalles." emptyCopy="La selección de accesorios estará disponible pronto." />
<TrustFaq />
```

For unconfigured or failed commerce, keep `CommerceState` once between the world selector and editorial content; do not render false product sections. Remove `FinalGlow` completely.

- [ ] **Step 4: Make catalog filters canonical and truthful**

Use `['Todos', 'Ropa', 'Accesorios']` as the fixed filter list. Compare products through `normalizeCollectionCategory`, mapping `Ropa` to `ropa` and `Accesorios` to `accesorios`. Preserve search and sorting. A valid empty category must stay selected and show zero results; only unknown query categories fall back to `Todos`.

- [ ] **Step 5: Update entry points**

Hero actions become `Descubrir ropa` → `#ropa` and `Ver accesorios` → `#accesorios`. MotionTrack becomes `ORIGINALES · CORREOS DE COSTA RICA · APARTADOS · RESPUESTA EN MENOS DE 24H`. Header and Footer expose only Ropa and Accesorios as collection links; Footer retains Carrito, legal links, and contact.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- tests/components/catalog-client.test.tsx tests/components/header.test.tsx tests/components/hero-media.test.tsx tests/components/home-scenes.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 7: Commit**

```powershell
git add app/page.tsx app/catalogo/CatalogClient.tsx components/Header.tsx components/Footer.tsx components/site/HeroMedia.tsx components/site/MotionTrack.tsx tests/components
git commit -m "feat: connect two-world storefront navigation"
```

### Task 4: FAQ and Truthful Service Policy

**Files:**
- Modify: `components/site/TrustFaq.tsx`
- Create: `app/envios-apartados/page.tsx`
- Modify: `app/envios-cambios/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `tests/components/home-scenes.test.tsx`
- Modify: `tests/components/policy-page.test.tsx`
- Modify: `e2e/store.spec.ts`

- [ ] **Step 1: Write failing FAQ and route tests**

Assert `TrustFaq` has heading `Preguntas frecuentes`, exactly five native `details` elements, no trust-chip list, no `cambios` text, and these summaries: originalidad, envíos, respuesta, apartados, seguimiento. Assert `/envios-apartados` policy copy includes Correos de Costa Rica and apartados, excludes changes, and the old route redirects.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/components/home-scenes.test.tsx tests/components/policy-page.test.tsx`

Expected: FAIL on the old FAQ and missing policy route.

- [ ] **Step 3: Implement the five-item FAQ**

Use native `details`/`summary` and the exact approved factual answers from the design spec. The shipping answer links to `/envios-apartados`. Do not add return/change language or specific layaway deposits and deadlines.

- [ ] **Step 4: Replace the policy route**

Create `app/envios-apartados/page.tsx` with sections `Correos de Costa Rica`, `Apartados`, `Seguimiento`, and `Ayuda`. The intro states that coverage, shipping cost, and layaway conditions are confirmed per order. Replace the old page body with:

```ts
import { permanentRedirect } from 'next/navigation'

export default function LegacyShippingPage() {
  permanentRedirect('/envios-apartados')
}
```

Update Footer and sitemap to `/envios-apartados`.

- [ ] **Step 5: Update browser trust routes**

Test `/envios-apartados` as the visible policy page and `/envios-cambios` as a redirect ending at `/envios-apartados`. Add `/cambios|devoluciones/i` to forbidden public commerce copy for the home and policy route checks, scoped so framework route names do not create false positives.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- tests/components/home-scenes.test.tsx tests/components/policy-page.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 7: Commit**

```powershell
git add components/site/TrustFaq.tsx components/Footer.tsx app/envios-apartados app/envios-cambios app/sitemap.ts tests/components e2e/store.spec.ts
git commit -m "fix: align service copy with Fyther policies"
```

### Task 5: Distinctive Responsive Styling and Motion

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/smoke.test.ts`
- Modify: `tests/components/header.test.tsx`

- [ ] **Step 1: Write failing CSS contract tests**

Assert the stylesheet defines `.collection-world-grid`, `.collection-world`, `.collection-section`, `.collection-empty`, and the centered one-column `.trust-faq-list`; removes `.category-rail`, `.trust-chips`, and `.final-glow`; sets stable image aspect ratios; and disables world image transforms plus accordion transitions under reduced motion.

- [ ] **Step 2: Run CSS tests and verify RED**

Run: `npm test -- tests/smoke.test.ts tests/components/header.test.tsx`

Expected: FAIL because the new CSS contracts are absent.

- [ ] **Step 3: Implement the desktop visual system**

Style the selector as a two-column open layout with dark photographic panels, restrained 6–8 px radii, readable scrims, cyan/pink category accents, stable `aspect-ratio`, and no nested cards. Give collection sections distinct but related rhythm, a three-column product grid at wide widths, an editorial empty state for Ropa, and a centered FAQ capped near 900 px.

- [ ] **Step 4: Implement purposeful interaction**

Add subtle image scale, scrim contrast, and arrow translation on pointer hover/focus; stagger product reveal through existing `data-reveal`; rotate FAQ chevrons and transition answer opacity/height without layout instability. Keep durations in the 180–500 ms range and easing controlled.

- [ ] **Step 5: Implement responsive and reduced-motion behavior**

At 767 px and below, stack worlds and products, preserve 44 px targets, prevent text clipping, and keep headings compact inside panels. In `prefers-reduced-motion`, remove spatial transforms and long transitions while retaining brief color/opacity feedback no longer than 120 ms.

- [ ] **Step 6: Run CSS tests and verify GREEN**

Run: `npm test -- tests/smoke.test.ts tests/components/header.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 7: Commit**

```powershell
git add app/globals.css tests/smoke.test.ts tests/components/header.test.tsx
git commit -m "style: polish Fyther two-world experience"
```

### Task 6: Full Verification, Preview, and Production Push

**Files:**
- Modify: `e2e/store.spec.ts` only if browser verification reveals a reproducible regression that first receives a failing test.
- Modify: `docs/superpowers/plans/2026-08-08-fyther-two-worlds-implementation.md` to check completed steps.

- [ ] **Step 1: Run the full local quality gate**

Run:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Expected: all unit tests, lint, typecheck, production build, and all Playwright projects pass without browser console errors or horizontal overflow.

- [ ] **Step 2: Inspect desktop and mobile screenshots**

Open the Playwright full-page captures for 1440×900 and 390×844. Confirm hero framing, two-world hierarchy, Ropa empty state, four real Accesorios products when live data is available, FAQ spacing, footer containment, no overlaps, no clipped labels, and no blank media.

- [ ] **Step 3: Run production-data smoke checks**

Start the production build locally with `.env.local`, open `/`, `/catalogo?categoria=Ropa`, `/catalogo?categoria=Accesorios`, `/carrito`, `/checkout`, and `/envios-apartados`. Confirm Ropa is empty, Accesorios uses only real Supabase products, and SINPE/efectivo remain the available checkout methods.

- [ ] **Step 4: Create and push stable Preview**

Create/update the `staging` branch from the verified feature commit and push it to origin. Confirm Vercel creates a Preview deployment using Preview variables; inspect deployment status and logs until Ready.

- [ ] **Step 5: Validate Preview**

Open the Vercel Preview URL at desktop and mobile sizes. Repeat home, category, FAQ, cart, checkout, and policy smoke checks. Confirm no secrets appear in client source or responses.

- [ ] **Step 6: Final review and production push**

Run `git diff origin/main...HEAD --check`, review the commit range, push `codex/fyther-v1-impl`, then fast-forward or merge the approved commits into `main` and push `main` to `origin` as explicitly requested by the user.

- [ ] **Step 7: Verify production**

Wait for the Vercel Production deployment to become Ready, open `https://www.fytherstore.com/`, verify the new headings and two category worlds, confirm the retired sections/copy are absent, and report the production commit SHA and URL.

---

## Definition of Done

- Only Ropa and Accesorios appear as shopping worlds.
- Real Supabase category data determines every rendered product.
- Empty Ropa never falls back to Accesorios or fabricated cards.
- “Por qué Fyther” and “Lo que sigue, a tu manera” remain absent.
- FAQ has five accurate questions and no change/return claim.
- Shipping policy says Correos de Costa Rica; response promise is under 24 hours; layaway terms are coordinated rather than invented.
- Mobile and desktop layouts are visually inspected and free of overlap.
- Reduced-motion behavior is respected.
- Preview and Production deployments are Ready.
- `main` is pushed to `https://github.com/stevengalocr/fytherstore.git`.
