# Fyther Store V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir y verificar la experiencia Fyther completa con diseño editorial, modo demo aislado y conexión BilBildin activada por variables de Vercel.

**Architecture:** Los componentes consumen un contrato `lib/commerce` independiente del proveedor. El servidor selecciona `demo` o `bilbildin`; el modo demo nunca ejecuta escrituras externas y el modo live mantiene secretos, validaciones y `business_id` en servidor. La UI se organiza por superficies de compra y comparte tokens, navegación, tarjetas y estados.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase, CSS, Lucide React, Vitest, Testing Library y Playwright.

---

## File Structure

- `lib/commerce/types.ts`: contrato normalizado de productos, pedidos y tracking.
- `lib/commerce/config.ts`: detección validada de modo demo/live.
- `lib/commerce/demo.ts`: catálogo y simulación aislada.
- `lib/commerce/bilbildin.ts`: lectura normalizada desde Supabase.
- `lib/commerce/index.ts`: fachada usada por rutas.
- `lib/commerce/checkout.ts`: validación y creación de pedidos live/demo.
- `lib/commerce/orders.ts`: confirmación y tracking normalizados.
- `components/commerce/*`: tarjetas, estados, precio y modo demo.
- `components/site/*`: navegación, footer, hero y bloques editoriales.
- `app/*`: composición de cada ruta y metadata.
- `tests/*`: pruebas de contrato y componentes.
- `e2e/store.spec.ts`: recorrido demo completo.

### Task 1: Testing foundation

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install test and UI dependencies**

Run: `npm install lucide-react && npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react @playwright/test`

Expected: lockfile updates without audit errors that block installation.

- [ ] **Step 2: Add scripts and configs**

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Configure Vitest with `jsdom`, alias `@` to the repository root and `vitest.setup.ts`; configure Playwright against `http://127.0.0.1:3000` with desktop and mobile Chromium projects.

- [ ] **Step 3: Write and run the initial smoke test**

```ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs TypeScript tests', () => expect(true).toBe(true))
})
```

Run: `npm test -- tests/smoke.test.ts`

Expected: PASS.

### Task 2: Commerce mode and normalized contract

**Files:**
- Create: `lib/commerce/types.ts`
- Create: `lib/commerce/config.ts`
- Create: `tests/commerce/config.test.ts`

- [ ] **Step 1: Write failing mode-selection tests**

```ts
it('uses demo mode when any public credential is missing', () => {
  expect(resolveCommerceMode({})).toBe('demo')
})

it('uses live mode when all public credentials are structurally valid', () => {
  expect(resolveCommerceMode({
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
    NEXT_PUBLIC_BUSINESS_ID: '11111111-1111-4111-8111-111111111111',
  })).toBe('live')
})
```

Run: `npm test -- tests/commerce/config.test.ts`

Expected: FAIL because `resolveCommerceMode` does not exist.

- [ ] **Step 2: Implement the contract and selector**

Define `CommerceProduct`, `CommerceVariant`, `CommerceOrder`, `CommerceTrackingEvent`, `CommerceMode`, `CheckoutInput` and `CheckoutResult`. Implement `resolveCommerceMode(env)` without reading private keys and export `commerceMode` for server usage.

- [ ] **Step 3: Verify green**

Run: `npm test -- tests/commerce/config.test.ts`

Expected: PASS.

### Task 3: Demo provider and simulated orders

**Files:**
- Create: `lib/commerce/demo.ts`
- Create: `lib/commerce/demo-orders.ts`
- Create: `tests/commerce/demo.test.ts`

- [ ] **Step 1: Write failing provider tests**

```ts
it('marks every fixture as demo and exposes valid CRC prices', async () => {
  const products = await demoCommerce.getProducts()
  expect(products.length).toBeGreaterThan(0)
  expect(products.every(product => product.demo && product.price.currency === 'CRC')).toBe(true)
})

it('creates an isolated demo order without an external client', async () => {
  const result = await createDemoOrder(validCheckoutInput)
  expect(result.orderId).toMatch(/^demo-/)
  expect(result.mode).toBe('demo')
})
```

Run: `npm test -- tests/commerce/demo.test.ts`

Expected: FAIL because the demo provider does not exist.

- [ ] **Step 2: Implement fixtures and deterministic simulation**

Create a small catalog explicitly labeled demo, using local campaign artwork and neutral product descriptions. Simulated orders must validate quantities, create `demo-*` identifiers, persist only in browser storage through a client helper and expose a default tracking sequence.

- [ ] **Step 3: Verify green**

Run: `npm test -- tests/commerce/demo.test.ts`

Expected: PASS.

### Task 4: BilBildin adapter and server security

**Files:**
- Create: `lib/commerce/bilbildin.ts`
- Create: `lib/commerce/mappers.ts`
- Modify: `lib/supabase.ts`
- Modify: `lib/supabase-server.ts`
- Replace: `app/actions/checkout.ts`
- Create: `tests/commerce/mappers.test.ts`
- Create: `tests/commerce/checkout.test.ts`

- [ ] **Step 1: Write failing mapping and validation tests**

```ts
it('maps zero stock to out_of_stock and never exposes cost fields', () => {
  const mapped = mapBilBildinProduct({ ...row, stock_quantity: 0 })
  expect(mapped.availability).toBe('out_of_stock')
  expect(mapped).not.toHaveProperty('cost_price')
})

it('rejects checkout when the business id is absent', async () => {
  await expect(validateLiveCheckoutConfig({})).rejects.toThrow('configuración')
})
```

Run: `npm test -- tests/commerce/mappers.test.ts tests/commerce/checkout.test.ts`

Expected: FAIL because mapping and validation functions do not exist.

- [ ] **Step 2: Implement read adapter**

Use the documented select list without `cost_price`; every query includes `.eq('business_id', businessId)` and `.eq('status', 'visible')`. Map variants, image fallbacks, compare-at price and availability into the normalized contract.

- [ ] **Step 3: Implement checkout dispatch and live action**

Dispatch demo requests to the simulator. Live requests validate active business, visible products, stock and server prices; all reads and writes include `business_id`. Keep service-role imports behind `server-only`. Preserve cart data when returning typed errors.

- [ ] **Step 4: Verify green and static secret boundaries**

Run: `npm test -- tests/commerce/mappers.test.ts tests/commerce/checkout.test.ts`

Run: `rg -n "SUPABASE_SERVICE_ROLE_KEY|createServiceClient" components context app --glob "*.tsx"`

Expected: tests PASS; no client component imports or references to the service-role key.

### Task 5: Global editorial design system

**Files:**
- Replace: `app/globals.css`
- Modify: `app/layout.tsx`
- Replace: `components/Header.tsx`
- Replace: `components/Footer.tsx`
- Create: `components/site/DemoBadge.tsx`
- Create: `components/site/Wordmark.tsx`
- Create: `tests/components/header.test.tsx`

- [ ] **Step 1: Write failing navigation tests**

```tsx
it('exposes labeled navigation and an accessible mobile menu button', () => {
  render(<Header />)
  expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /menú/i })).toBeInTheDocument()
})
```

Run: `npm test -- tests/components/header.test.tsx`

Expected: FAIL against the current header.

- [ ] **Step 2: Implement tokens, typography and shell**

Use `next/font` for Archivo and Manrope. Define Obsidian, Bone, Volt, Graphite, Titanium and Pure tokens, an 8 px maximum card radius, visible focus, 44 px touch targets and reduced-motion overrides. Build icon-based menu/cart controls with Lucide and a restrained demo indicator.

- [ ] **Step 3: Verify green**

Run: `npm test -- tests/components/header.test.tsx`

Expected: PASS.

### Task 6: Home editorial experience

**Files:**
- Replace: `app/page.tsx`
- Create: `components/site/HeroMedia.tsx`
- Create: `components/site/MotionTrack.tsx`
- Create: `components/site/CategoryRail.tsx`
- Create: `components/site/EditorialSections.tsx`
- Create: `components/commerce/ProductGrid.tsx`
- Create: `components/commerce/CommerceState.tsx`
- Create: `tests/components/commerce-state.test.tsx`

- [ ] **Step 1: Write failing empty/error state tests**

```tsx
it('renders the honest live empty state without fake product cards', () => {
  render(<CommerceState mode="live" state="empty" />)
  expect(screen.getByText(/First drop in motion/i)).toBeInTheDocument()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})
```

Run: `npm test -- tests/components/commerce-state.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 2: Implement the home**

Compose hero poster/video with eyebrow `FYTHER / ACTIVE STORE`, H1 `MOVE DIFFERENT.`, approved body and `Shop the drop`. Add derived categories, featured products, manifesto, neutral trust copy, FAQ and final CTA. Pause video outside viewport and do not autoplay under reduced motion or data-saving conditions.

- [ ] **Step 3: Verify green**

Run: `npm test -- tests/components/commerce-state.test.tsx`

Expected: PASS.

### Task 7: Catalog and product detail

**Files:**
- Replace: `components/ProductCard.tsx`
- Replace: `app/catalogo/page.tsx`
- Replace: `app/catalogo/CatalogClient.tsx`
- Replace: `app/catalogo/[slug]/page.tsx`
- Replace: `app/catalogo/[slug]/ProductDetail.tsx`
- Create: `tests/components/product-card.test.tsx`

- [ ] **Step 1: Write failing product-state tests**

```tsx
it('disables purchase for an out-of-stock product', () => {
  render(<ProductCard product={outOfStockProduct} />)
  expect(screen.getByRole('button', { name: /agotado/i })).toBeDisabled()
})

it('uses a meaningful text fallback when no product image exists', () => {
  render(<ProductCard product={productWithoutImages} />)
  expect(screen.getByText(productWithoutImages.name)).toBeInTheDocument()
})
```

Run: `npm test -- tests/components/product-card.test.tsx`

Expected: FAIL against the current card API.

- [ ] **Step 2: Implement catalog and detail**

Build category filtering, ordering, result count, image fallback, compare-at price, variants, stock messaging and cart actions. Use stable aspect ratios and no nested cards.

- [ ] **Step 3: Verify green**

Run: `npm test -- tests/components/product-card.test.tsx`

Expected: PASS.

### Task 8: Cart and checkout

**Files:**
- Refactor: `context/CartContext.tsx`
- Replace: `app/carrito/page.tsx`
- Replace: `app/checkout/page.tsx`
- Replace: `app/checkout/CheckoutClient.tsx`
- Create: `tests/context/cart.test.tsx`
- Create: `tests/components/checkout.test.tsx`

- [ ] **Step 1: Write failing persistence and validation tests**

```tsx
it('merges identical cart lines and clamps quantity to available stock', async () => {
  const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
  act(() => result.current.add(product, selectedVariant, 2))
  act(() => result.current.add(product, selectedVariant, 2))
  expect(result.current.items[0].quantity).toBe(product.stockQuantity)
})

it('announces validation errors and keeps customer input', async () => {
  render(<CheckoutClient mode="demo" />)
  await userEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))
  expect(screen.getByRole('alert')).toBeInTheDocument()
})
```

Run: `npm test -- tests/context/cart.test.tsx tests/components/checkout.test.tsx`

Expected: FAIL against current behavior.

- [ ] **Step 2: Implement cart and checkout UI**

Add quantity steppers, remove buttons, empty state, subtotal and a clear demo notice. Use native inputs with labels, autocomplete and typed server-action results. Methods are SINPE, payment link and cash only when provided by store configuration; demo uses explicit simulated options.

- [ ] **Step 3: Verify green**

Run: `npm test -- tests/context/cart.test.tsx tests/components/checkout.test.tsx`

Expected: PASS.

### Task 9: Confirmation, tracking, legal and SEO

**Files:**
- Replace: `app/confirmacion/[orderId]/page.tsx`
- Replace: `app/tracking/[orderId]/page.tsx`
- Create: `app/privacidad/page.tsx`
- Create: `app/terminos/page.tsx`
- Create: `app/envios-cambios/page.tsx`
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Modify: `app/not-found.tsx`
- Create: `tests/commerce/orders.test.ts`

- [ ] **Step 1: Write failing order isolation tests**

```ts
it('requires both order id and business id for live confirmation queries', () => {
  expect(buildOrderFilters('order-1', 'business-1')).toEqual({
    id: 'order-1',
    business_id: 'business-1',
  })
})
```

Run: `npm test -- tests/commerce/orders.test.ts`

Expected: FAIL because the order reader does not expose the guarded filters.

- [ ] **Step 2: Implement normalized order views**

Read demo orders from the simulator and live orders on the server. Render order summary, payment instructions only when configured, and tracking events in chronological order. Add not-found handling without leaking whether another tenant owns an ID.

- [ ] **Step 3: Add transparent legal pages and SEO**

Use real contact details and avoid invented shipping deadlines, return windows or guarantees. Add canonical support from `NEXT_PUBLIC_SITE_URL`, metadata, Open Graph, sitemap and robots. Product schema appears only for live products.

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/commerce/orders.test.ts`

Expected: PASS.

### Task 10: Documentation, end-to-end verification and release

**Files:**
- Replace: `README.md`
- Replace: `.env.example`
- Create: `e2e/store.spec.ts`

- [ ] **Step 1: Write the end-to-end demo flow**

```ts
test('completes the demo purchase and opens tracking', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Shop the drop/i }).click()
  await page.getByRole('link', { name: /ver producto/i }).first().click()
  await page.getByRole('button', { name: /agregar al carrito/i }).click()
  await page.getByRole('link', { name: /checkout/i }).click()
  await page.getByLabel(/nombre/i).fill('Cliente Demo')
  await page.getByLabel(/correo/i).fill('demo@example.com')
  await page.getByLabel(/dirección/i).fill('San José')
  await page.getByRole('button', { name: /confirmar pedido/i }).click()
  await expect(page.getByText(/pedido confirmado/i)).toBeVisible()
  await page.getByRole('link', { name: /seguir pedido/i }).click()
  await expect(page.getByText(/pedido recibido/i)).toBeVisible()
})
```

- [ ] **Step 2: Document deployment**

Document demo behavior, the four Vercel variables, the boundary of `service_role`, BilBildin ownership, and a production smoke checklist. Keep `.env.example` value-free.

- [ ] **Step 3: Run the full quality gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build`

Expected: all commands exit 0 with no application errors.

- [ ] **Step 4: Run browser verification**

Run: `npm run dev`, then `npm run test:e2e` and capture desktop/mobile screenshots. Inspect hero, catalog, product, cart, checkout, confirmation, tracking, legal routes and reduced motion. Fix one batched defect pass and confirm once.

- [ ] **Step 5: Commit and publish**

```bash
git add .
git commit -m "feat: deliver Fyther Store V1"
git push -u origin codex/fyther-v1:main
```

Expected: GitHub `main` points to the verified Fyther Store V1 commit.
