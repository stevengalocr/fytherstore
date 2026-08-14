# Fyther Categories and Products Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renovar las secciones de categorías y productos de la portada con portadas editoriales originales, filtros reales y una cuadrícula comercial responsive, sin alterar el resto de la experiencia Fyther.

**Architecture:** La página seguirá obteniendo una sola colección desde `commerce.getProducts()` y separándola con `splitProductsByWorld()`. Una función pura derivará hasta cinco filtros de etiquetas reales; `CollectionWorlds` presentará las dos portadas y esos filtros, mientras `CollectionSection` conservará los estados vacíos y aplicará el énfasis visual únicamente a Accesorios. El catálogo aceptará `buscar` como estado inicial para que los filtros de portada tengan enlaces reproducibles.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, next/image, Lucide React, CSS nativo, Vitest + Testing Library, Playwright, Supabase/BilBildin mediante la capa `commerce` existente.

---

## File Map

- Modify: `lib/home-selection.ts` — derivar filtros únicos desde etiquetas reales.
- Modify: `tests/home-selection.test.ts` — cubrir normalización, orden, umbral y límite de filtros.
- Modify: `app/catalogo/page.tsx` — leer y limitar la consulta `buscar`.
- Modify: `app/catalogo/CatalogClient.tsx` — iniciar y sincronizar la búsqueda; incluir etiquetas en las coincidencias.
- Modify: `tests/components/catalog-client.test.tsx` — probar consulta inicial, etiquetas y sincronización.
- Modify: `tests/components/recovery-pages.test.tsx` — conservar el contrato server-side de `CatalogPage`.
- Create: `public/collection-ropa.webp` — portada editorial de Ropa, no comprable.
- Create: `public/collection-accesorios.webp` — portada editorial de Accesorios, no comprable.
- Modify: `components/site/CollectionWorlds.tsx` — rail editorial, portadas nuevas y filtros secundarios.
- Modify: `components/site/CollectionSection.tsx` — encabezado comercial y primera tarjeta destacada.
- Modify: `app/page.tsx` — conectar etiquetas reales y copy aprobado.
- Modify: `app/globals.css` — composición desktop, rail táctil, cuadrícula destacada, estados de foco y movimiento reducido.
- Modify: `tests/components/home-scenes.test.tsx` — contratos de estructura, imágenes, filtros y producto destacado.
- Modify: `tests/components/home-page.test.tsx` — flujo de datos y copy final de la portada.
- Modify: `lib/commerce/e2e-fixture.ts` — datos deterministas con tres accesorios y etiquetas solo para E2E.
- Modify: `tests/commerce/e2e-fixture.test.ts` — proteger el contrato del fixture configurado.
- Modify: `e2e/store.spec.ts` — geometría responsive, recursos, scroll snap, zoom y reduced motion.

### Task 1: Derive Real Accessory Filters

**Files:**
- Modify: `lib/home-selection.ts`
- Test: `tests/home-selection.test.ts`

- [ ] **Step 1: Write the failing filter-selection tests**

Extend the product helper with tags and add these cases:

```ts
function product(
  id: string,
  featured = false,
  category: string | null = null,
  tags: string[] = [],
): CommerceProduct {
  return {
    id,
    slug: id,
    name: id,
    shortDescription: null,
    description: null,
    price: { amount: 10000, currency: 'CRC' },
    compareAtPrice: null,
    images: [],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category,
    tags,
    featured,
  }
}

describe('selectAccessoryTags', () => {
  it('trims, deduplicates case-insensitively, preserves order, and caps five tags', () => {
    const products = [
      product('one', false, 'Accesorios', [' Botellas ', 'Gym', 'botellas']),
      product('two', false, 'Accesorios', ['Organización', 'Medallas', 'Regalos', 'Viaje']),
    ]

    expect(selectAccessoryTags(products)).toEqual([
      'Botellas',
      'Gym',
      'Organización',
      'Medallas',
      'Regalos',
    ])
  })

  it('returns no filters until two distinct non-empty tags exist', () => {
    expect(selectAccessoryTags([product('one', false, 'Accesorios', ['', 'Gym', ' gym '])])).toEqual([])
  })
})
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```powershell
npm test -- tests/home-selection.test.ts
```

Expected: FAIL because `selectAccessoryTags` is not exported.

- [ ] **Step 3: Implement the pure selector**

Add to `lib/home-selection.ts`:

```ts
export function selectAccessoryTags(products: CommerceProduct[], limit = 5): string[] {
  const boundedLimit = Math.max(0, limit)
  const tags: string[] = []
  const normalizedTags = new Set<string>()

  for (const product of products) {
    for (const rawTag of product.tags) {
      const tag = rawTag.trim()
      const normalized = tag.toLocaleLowerCase('es')
      if (!tag || normalizedTags.has(normalized)) continue
      normalizedTags.add(normalized)
      tags.push(tag)
      if (tags.length >= boundedLimit) return tags.length >= 2 ? tags : []
    }
  }

  return tags.length >= 2 ? tags : []
}
```

- [ ] **Step 4: Run the selector tests**

Run:

```powershell
npm test -- tests/home-selection.test.ts
```

Expected: all tests in the file PASS.

- [ ] **Step 5: Commit the filter unit**

```powershell
git add lib/home-selection.ts tests/home-selection.test.ts
git commit -m "feat: derive accessory filters from live tags"
```

### Task 2: Make Editorial Filters Reproducible in the Catalog

**Files:**
- Modify: `app/catalogo/page.tsx`
- Modify: `app/catalogo/CatalogClient.tsx`
- Test: `tests/components/catalog-client.test.tsx`
- Test: `tests/components/recovery-pages.test.tsx`

- [ ] **Step 1: Write failing client tests for initial query and tags**

Give `Top Brisa` the tag `['Gym']`, pass `initialQuery`, and add:

```tsx
it('starts from the URL query and matches product tags', () => {
  render(<CatalogClient products={products} initialCategory="Accesorios" initialQuery="Gym" />)

  expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('Gym')
  expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
  expect(within(productList()).queryByText('Legging Flujo')).not.toBeInTheDocument()
})

it('synchronizes the query when URL-derived props change', async () => {
  const { rerender } = render(
    <CatalogClient products={products} initialCategory="Todos" initialQuery="legging" />,
  )

  rerender(<CatalogClient products={products} initialCategory="Accesorios" initialQuery="Gym" />)

  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('Gym'))
  expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
})
```

Update every existing render to pass `initialQuery=""`.

- [ ] **Step 2: Write the failing server-page contract test**

Mock `CatalogClient` in `tests/components/recovery-pages.test.tsx` before importing `CatalogPage`:

```tsx
vi.mock('@/app/catalogo/CatalogClient', () => ({
  default: ({ initialCategory, initialQuery }: {
    initialCategory: string
    initialQuery: string
  }) => (
    <div
      data-testid="catalog-client"
      data-category={initialCategory}
      data-query={initialQuery}
    />
  ),
}))
```

Make the commerce mock return at least one product, then render:

```tsx
render(await CatalogPage({
  searchParams: Promise.resolve({ categoria: 'Accesorios', buscar: ['Gym', 'ignored'] }),
}))

expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-category', 'Accesorios')
expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-query', 'Gym')
```

- [ ] **Step 3: Run focused tests and verify failure**

```powershell
npm test -- tests/components/catalog-client.test.tsx tests/components/recovery-pages.test.tsx
```

Expected: FAIL because `initialQuery` and the `buscar` search parameter are not supported.

- [ ] **Step 4: Implement bounded server parsing and client synchronization**

In `app/catalogo/page.tsx` use:

```tsx
type CatalogSearchParams = {
  categoria?: string | string[]
  buscar?: string | string[]
}

function firstParam(value: string | string[] | undefined, fallback = '') {
  const selected = Array.isArray(value) ? value[0] : value
  return (selected ?? fallback).trim().slice(0, 80)
}

export default async function CatalogPage({ searchParams }: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const params = await searchParams
  try {
    const products = await commerce.getProducts()
    if (commerceMode === 'unconfigured') return <><CatalogHeader /><CommerceState state="unconfigured" /></>
    if (products.length === 0) return <><CatalogHeader /><CommerceState state="empty" /></>
    return (
      <CatalogClient
        products={products}
        initialCategory={firstParam(params.categoria, 'Todos')}
        initialQuery={firstParam(params.buscar)}
      />
    )
  } catch {
    return <CommerceState state="error" />
  }
}
```

In `CatalogClient.tsx`, add `initialQuery: string`, initialize `query` from it, synchronize it in an effect, and change the searchable value to:

```ts
const searchable = [product.name, product.shortDescription ?? '', ...product.tags]
  .join(' ')
  .toLocaleLowerCase('es')

return (category === 'Todos' || normalizeCollectionCategory(product.category) === normalizedCategory)
  && (!normalized || searchable.includes(normalized))
```

- [ ] **Step 5: Run focused tests and typecheck**

```powershell
npm test -- tests/components/catalog-client.test.tsx tests/components/recovery-pages.test.tsx
npm run typecheck
```

Expected: both commands PASS.

- [ ] **Step 6: Commit catalog query support**

```powershell
git add app/catalogo/page.tsx app/catalogo/CatalogClient.tsx tests/components/catalog-client.test.tsx tests/components/recovery-pages.test.tsx
git commit -m "feat: support shareable catalog searches"
```

### Task 3: Generate and Validate the Editorial Covers

**Files:**
- Create: `public/collection-ropa.webp`
- Create: `public/collection-accesorios.webp`

- [ ] **Step 1: Generate the Ropa cover with the image generation tool**

Use this exact creative brief and request no typography:

```text
Vertical 4:5 premium editorial flat lay for Fyther Store, a warm contemporary Costa Rican women’s activewear boutique. Matte black leggings and a black sports top arranged naturally on a dark charcoal tactile studio surface, refined textile detail, a minimal folded training towel and subtle everyday workout object, soft cyan side light balanced by a restrained soft pink edge light, realistic commercial photography, calm feminine energy, close and sophisticated rather than aggressive, generous clean negative space in the lower-left for web interface copy, crisp product readability, no person, no anatomy, no text, no lettering, no logo, no watermark, no invented brand.
```

Save the selected result as `public/collection-ropa.webp`.

- [ ] **Step 2: Generate the Accesorios cover with the image generation tool**

```text
Vertical 4:5 premium editorial product photograph for Fyther Store, a warm contemporary Costa Rican women’s fitness boutique. A curated realistic arrangement of a reusable sports bottle, elegant medal display organizer and small practical training accessories on a dark charcoal studio surface, useful and collectible mood, soft cyan side light with restrained pink rim light, balanced depth, crisp materials, calm modern commercial photography, generous negative space in the lower-left for web interface copy, no person, no anatomy, no text, no lettering, no logo, no watermark, no invented brand.
```

Save the selected result as `public/collection-accesorios.webp`.

- [ ] **Step 3: Inspect both images visually**

Open each file with `view_image` at original detail. Reject and regenerate any result containing embedded text, malformed objects, fake branding, weak product readability, or insufficient negative space.

- [ ] **Step 4: Verify file format, dimensions, aspect ratio, and size**

Run:

```powershell
@'
const sharp = require('sharp')
const files = ['public/collection-ropa.webp', 'public/collection-accesorios.webp']
Promise.all(files.map(async (file) => {
  const metadata = await sharp(file).metadata()
  const ratio = metadata.width / metadata.height
  if (metadata.format !== 'webp') throw new Error(`${file}: expected WebP`)
  if (Math.abs(ratio - 0.8) > 0.03) throw new Error(`${file}: expected 4:5`)
  if (metadata.width < 1200) throw new Error(`${file}: width below 1200px`)
  console.log(file, metadata.width, metadata.height, metadata.format)
}))
'@ | node
```

Expected: two WebP files, each at least 1200 px wide and within 0.03 of a 4:5 ratio. Optimize with Sharp quality 84 only if either file exceeds 700 KB.

- [ ] **Step 5: Commit the approved assets**

```powershell
git add public/collection-ropa.webp public/collection-accesorios.webp
git commit -m "assets: add editorial collection covers"
```

### Task 4: Build the Two-Category Editorial Rail

**Files:**
- Modify: `components/site/CollectionWorlds.tsx`
- Test: `tests/components/home-scenes.test.tsx`

- [ ] **Step 1: Replace the old world tests with the approved contract**

Test the new heading, descriptions, assets, anchors, availability and filters:

```tsx
const { container } = render(
  <CollectionWorlds
    ropaAvailable={false}
    accesoriosAvailable
    accessoryTags={['Botellas', 'Gym']}
  />,
)

expect(screen.getByText('EXPLORA')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: 'Encuentra tu movimiento.' })).toBeInTheDocument()
expect(screen.getByText('Dos formas de explorar piezas elegidas para acompañarte.')).toBeInTheDocument()
expect(screen.getByRole('img', { name: /selección editorial de ropa/i })).toHaveAttribute(
  'src',
  expect.stringContaining('collection-ropa'),
)
expect(screen.getByRole('img', { name: /selección editorial de accesorios/i })).toHaveAttribute(
  'src',
  expect.stringContaining('collection-accesorios'),
)
expect(screen.getByRole('link', { name: 'Explorar accesorios con la etiqueta Botellas' })).toHaveAttribute(
  'href',
  '/catalogo?categoria=Accesorios&buscar=Botellas',
)
expect(container.querySelector('.collection-world-filters')).toBeInTheDocument()
```

Add the absence case:

```tsx
const { container } = render(
  <CollectionWorlds ropaAvailable={false} accesoriosAvailable accessoryTags={['Gym']} />,
)
expect(container.querySelector('.collection-world-filters')).not.toBeInTheDocument()
expect(screen.getByRole('link', { name: /descubrir ropa/i })).toHaveAccessibleDescription('Próximamente')
```

Update the other `CollectionWorlds` renders in this file with `accessoryTags={[]}` while retaining their current `aria-describedby` assertions.

- [ ] **Step 2: Run the scene test and verify failure**

```powershell
npm test -- tests/components/home-scenes.test.tsx
```

Expected: FAIL on the new prop, copy, asset paths and filter links.

- [ ] **Step 3: Implement the rail markup**

Update the props and image source contract:

```tsx
interface CollectionWorldsProps {
  ropaAvailable: boolean | null
  accesoriosAvailable: boolean | null
  accessoryTags: string[]
}

const COLLECTION_IMAGE_SIZES = '(max-width: 1024px) 82vw, 50vw'
```

Render `EXPLORA`, `Encuentra tu movimiento.`, the approved one-line description, and the two existing links using `/collection-ropa.webp` and `/collection-accesorios.webp`. After the rail, render filters only when `accessoryTags.length >= 2`:

```tsx
{accessoryTags.length >= 2 && (
  <nav className="collection-world-filters" aria-label="Explorar accesorios por etiqueta">
    {accessoryTags.map((tag) => (
      <Link
        key={tag.toLocaleLowerCase('es')}
        href={`/catalogo?categoria=Accesorios&buscar=${encodeURIComponent(tag)}`}
        aria-label={`Explorar accesorios con la etiqueta ${tag}`}
      >
        {tag}
      </Link>
    ))}
  </nav>
)}
```

- [ ] **Step 4: Run the scene tests**

```powershell
npm test -- tests/components/home-scenes.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the category component**

```powershell
git add components/site/CollectionWorlds.tsx tests/components/home-scenes.test.tsx
git commit -m "feat: build editorial collection rail"
```

### Task 5: Add the Commercial Product Composition

**Files:**
- Modify: `components/site/CollectionSection.tsx`
- Test: `tests/components/home-scenes.test.tsx`

- [ ] **Step 1: Write failing product-grid structure tests**

Render three Accesorios and assert only the first wrapper is featured:

```tsx
const wrappers = container.querySelectorAll('#accesorios .collection-product-card')
expect(wrappers).toHaveLength(3)
expect(wrappers[0]).toHaveClass('collection-product-card-featured')
expect(wrappers[1]).not.toHaveClass('collection-product-card-featured')
expect(wrappers[2]).not.toHaveClass('collection-product-card-featured')
expect(within(container.querySelector('#accesorios') as HTMLElement).getByRole('link', {
  name: 'Ver todos los accesorios',
})).toHaveAttribute('href', '/catalogo?categoria=Accesorios')
```

Add the small-grid case:

```tsx
const { container } = render(
  <CollectionSection
    id="accesorios"
    eyebrow="SELECCIÓN ACTUAL"
    title="Lo que se está llevando."
    description="Accesorios originales y útiles."
    products={[product('one', 'Uno'), product('two', 'Dos')]}
    emptyTitle="Estamos preparando los detalles."
    emptyCopy="La selección estará disponible pronto."
  />,
)
expect(container.querySelector('.collection-product-card-featured')).not.toBeInTheDocument()
```

In the populated Ropa test, also assert `container.querySelector('.collection-product-card-featured')` is absent. Preserve the empty Ropa test exactly.

- [ ] **Step 2: Run the scene tests and verify failure**

```powershell
npm test -- tests/components/home-scenes.test.tsx
```

Expected: FAIL because the featured class does not exist.

- [ ] **Step 3: Add the deterministic featured class**

Inside `CollectionSection`:

```tsx
const usesFeaturedLayout = id === 'accesorios' && products.length >= 3

{products.map((product, index) => (
  <div
    key={product.id}
    className={`collection-product-card${usesFeaturedLayout && index === 0
      ? ' collection-product-card-featured'
      : ''}`}
    data-reveal
  >
    <ProductCard product={product} imageSizes={COLLECTION_PRODUCT_IMAGE_SIZES} />
  </div>
))}
```

Do not change the `ProductCard` props or substitute any Supabase image.

- [ ] **Step 4: Run the scene and product-card tests**

```powershell
npm test -- tests/components/home-scenes.test.tsx tests/components/product-card.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the product composition**

```powershell
git add components/site/CollectionSection.tsx tests/components/home-scenes.test.tsx
git commit -m "feat: add editorial accessory product grid"
```

### Task 6: Connect Live Tags and Final Copy on the Home Page

**Files:**
- Modify: `app/page.tsx`
- Test: `tests/components/home-page.test.tsx`

- [ ] **Step 1: Write the failing home data-flow assertions**

Give the accessory fixture `tags: ['Botellas', 'Gym']`, then assert:

```tsx
expect(screen.getByRole('heading', { name: 'Encuentra tu movimiento.' })).toBeInTheDocument()
expect(screen.getByRole('link', { name: 'Explorar accesorios con la etiqueta Botellas' })).toBeInTheDocument()
expect(within(accesorios).getByText('SELECCIÓN ACTUAL')).toBeInTheDocument()
expect(within(accesorios).getByRole('heading', { name: 'Lo que se está llevando.' })).toBeInTheDocument()
```

Keep the existing scene order, failure-state and empty-state expectations.

- [ ] **Step 2: Run the home-page test and verify failure**

```powershell
npm test -- tests/components/home-page.test.tsx
```

Expected: FAIL on the new tags and copy.

- [ ] **Step 3: Connect the selector and approved text**

Import `selectAccessoryTags`, derive once after splitting, and pass it:

```tsx
const { ropa, accesorios } = splitProductsByWorld(products)
const accessoryTags = selectAccessoryTags(accesorios)

<CollectionWorlds
  ropaAvailable={commerceUnavailable ? null : ropa.length > 0}
  accesoriosAvailable={commerceUnavailable ? null : accesorios.length > 0}
  accessoryTags={commerceUnavailable ? [] : accessoryTags}
/>
```

Change only the Accesorios section copy:

```tsx
<CollectionSection
  id="accesorios"
  eyebrow="SELECCIÓN ACTUAL"
  title="Lo que se está llevando."
  description="Accesorios originales y útiles para organizar, celebrar y acompañar cada meta."
  products={accesorios}
  emptyTitle="Estamos preparando los detalles."
  emptyCopy="La selección de accesorios estará disponible pronto."
/>
```

- [ ] **Step 4: Run home tests**

```powershell
npm test -- tests/components/home-page.test.tsx tests/components/home-scenes.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the page integration**

```powershell
git add app/page.tsx tests/components/home-page.test.tsx
git commit -m "feat: connect live tags to home collections"
```

### Task 7: Implement Responsive Layout, Motion, and Focus Polish

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the desktop editorial composition**

Replace the relevant collection rules with these stable constraints:

```css
.collection-world-heading { max-width: 920px; }
.collection-world-description { max-width: 48ch; margin: 1rem 0 clamp(2.5rem, 5vw, 4.5rem); color: var(--color-mist); line-height: 1.7; }
.collection-world-title { max-width: 12ch; margin: 0.7rem 0 0; }
.collection-world-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(1rem, 2.5vw, 2rem); }
.collection-world-filters { margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.55rem; }
.collection-world-filters a { min-height: 44px; padding: 0.7rem 1rem; display: inline-flex; align-items: center; border: 1px solid rgba(234, 251, 251, 0.2); border-radius: 999px; color: var(--color-mist); font-size: 0.78rem; }
.collection-world-filters a:focus-visible { outline: 2px solid var(--color-cyan); outline-offset: 3px; }
.collection-product-card-featured { grid-column: span 2; }
.collection-product-card-featured .product-media { aspect-ratio: 8 / 5; }
.collection-product-card:nth-child(2)[data-reveal]:not([data-reveal='on']) { transition-delay: 60ms; }
.collection-product-card:nth-child(3)[data-reveal]:not([data-reveal='on']) { transition-delay: 90ms; }
```

Keep cards at 8 px radius or less. Update the existing hover image scale from `1.02` to `1.025` and add a restrained filter hover using cyan border/text only.

- [ ] **Step 2: Convert tablet and mobile category layout to a native rail**

Inside `@media (max-width: 1024px)` add:

```css
.collection-world-grid {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline mandatory;
  scrollbar-width: none;
}
.collection-world-grid::-webkit-scrollbar { display: none; }
.collection-world-panel { flex: 0 0 min(78vw, 520px); scroll-snap-align: start; }
.collection-product-card-featured { grid-column: auto; }
.collection-product-card-featured .product-media { aspect-ratio: 4 / 5; }
```

Inside `@media (max-width: 560px)`, use `flex-basis: 84vw`, keep filter links on one horizontal scroll row, and ensure the page itself has no horizontal overflow.

- [ ] **Step 3: Complete reduced-motion and focus behavior**

Add the filters to the existing reduced-motion transition list and remove all reveal staggering under reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .collection-product-card[data-reveal] { transition-delay: 0ms !important; }
  .collection-world-filters a {
    transition-property: background-color, border-color, color, opacity;
    transition-duration: 120ms;
  }
}
```

- [ ] **Step 4: Run static and component verification**

```powershell
npm run lint
npm run typecheck
npm test -- tests/components/home-scenes.test.tsx tests/components/home-page.test.tsx
```

Expected: all commands PASS.

- [ ] **Step 5: Commit responsive styling**

```powershell
git add app/globals.css
git commit -m "style: polish collection rail and product grid"
```

### Task 8: Extend Browser Verification and Finish the Delivery

**Files:**
- Modify: `lib/commerce/e2e-fixture.ts`
- Test: `tests/commerce/e2e-fixture.test.ts`
- Modify: `e2e/store.spec.ts`

- [ ] **Step 1: Seed deterministic tags and a third E2E accessory**

Set the first fixture product to `tags: ['Botellas', 'Gym']`, the second to `tags: ['Gym', 'Organización']`, and append:

```ts
{
  id: 'fyther-e2e-accesorio-03',
  slug: 'accesorio-fyther-tres',
  name: 'Accesorio Fyther Tres',
  shortDescription: 'Un detalle para tu rutina diaria',
  description: null,
  price: { amount: 12000, currency: 'CRC' },
  compareAtPrice: null,
  images: [{ src: '/home.jpeg', alt: 'Accesorio Fyther Tres' }],
  availability: 'in_stock',
  stockQuantity: 2,
  variants: [],
  category: 'Accesorios',
  tags: ['Regalos'],
  featured: false,
}
```

Update `tests/commerce/e2e-fixture.test.ts` to expect the third id/slug, image list `['/ropa.png', '/modelo2.png', '/home.jpeg']`, and:

```ts
expect(products.map(({ tags }) => tags)).toEqual([
  ['Botellas', 'Gym'],
  ['Gym', 'Organización'],
  ['Regalos'],
])
```

- [ ] **Step 2: Run the fixture test**

```powershell
npm test -- tests/commerce/e2e-fixture.test.ts
```

Expected: PASS with three deterministic Accesorios and no Ropa fixture.

- [ ] **Step 3: Add configured storefront assertions**

Within the existing configured branch, assert assets, grid and links:

```ts
await expect(page.getByRole('heading', { name: 'Encuentra tu movimiento.' })).toBeVisible()
await expect(page.locator('.collection-world-media img')).toHaveCount(2)
await expect.poll(() => page.locator('.collection-world-media img').evaluateAll((images) =>
  images.map((image) => {
    const media = image as HTMLImageElement
    return media.complete && media.naturalWidth >= 1200
  }),
)).toEqual([true, true])

const accessoryCards = page.locator('#accesorios .collection-product-card')
if (await accessoryCards.count() >= 3 && isDesktop) {
  await expect(accessoryCards.first()).toHaveClass(/collection-product-card-featured/)
  const featuredMedia = accessoryCards.first().locator('.product-media')
  const ratio = await featuredMedia.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return box.width / box.height
  })
  expect(ratio).toBeCloseTo(8 / 5, 1)
}
```

When `.collection-world-filters a` exists, click the first filter and assert the destination contains `categoria=Accesorios`, `buscar=`, the search field is populated and at least one matching result is present.

- [ ] **Step 4: Verify tablet/mobile rail geometry and desktop columns**

Add computed-style checks:

```ts
const worldLayout = await page.locator('.collection-world-grid').evaluate((element) => {
  const style = getComputedStyle(element)
  return { display: style.display, overflowX: style.overflowX, snap: style.scrollSnapType }
})

if (isDesktop) {
  expect(worldLayout.display).toBe('grid')
} else {
  expect(worldLayout.display).toBe('flex')
  expect(['auto', 'scroll']).toContain(worldLayout.overflowX)
  expect(worldLayout.snap).toContain('mandatory')
}
```

Preserve `expectHealthyPage`, overlap, clipping, browser error and full-page screenshot checks.

- [ ] **Step 5: Add a reduced-motion assertion**

Use `page.emulateMedia({ reducedMotion: 'reduce' })`, reload, and assert collection reveal transforms are `none` and product reveal transition delays are `0s`.

- [ ] **Step 6: Run the full quality gate**

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

Expected: unit tests, lint, typecheck, production build and all configured/unconfigured Playwright projects PASS; audit reports zero high/critical vulnerabilities; diff check emits no errors.

- [ ] **Step 7: Inspect Playwright screenshots**

Inspect the 390 x 844, 768 x 1024 and 1440 x 900 configured screenshots. Confirm:

```text
- Both category covers are sharp and readable.
- The next category is partially visible on tablet/mobile.
- Product cards use real fixture/Supabase images, never category covers.
- The first accessory card is wider only on desktop with at least three products.
- Text remains contained at 200% zoom.
- No overlap, blank media, page-level horizontal overflow, or clipped controls.
```

Fix any visual defect in the owning component or CSS rule, then rerun the affected tests and the full Playwright matrix.

- [ ] **Step 8: Commit browser coverage and any verified polish**

```powershell
git add lib/commerce/e2e-fixture.ts tests/commerce/e2e-fixture.test.ts e2e/store.spec.ts app/globals.css components/site/CollectionWorlds.tsx components/site/CollectionSection.tsx
git commit -m "test: verify refreshed storefront presentation"
```

### Task 9: Final Preview and Push

**Files:**
- No source files expected; environment and deployment verification only.

- [ ] **Step 1: Confirm repository hygiene**

```powershell
git status --short
git log --oneline --decorate -10
git grep -n -I -E "service_role|SUPABASE_SERVICE_ROLE_KEY|eyJ[A-Za-z0-9_-]{20,}" -- ':!package-lock.json'
```

Expected: clean worktree and no committed secrets.

- [ ] **Step 2: Push the implementation branch**

```powershell
git push -u origin codex/fyther-v1-impl
```

Expected: push succeeds and the branch tracks `origin/codex/fyther-v1-impl`.

- [ ] **Step 3: Validate Vercel Preview with live environment variables**

Open the Preview deployment generated from `codex/fyther-v1-impl`. Confirm the two category covers return HTTP 200, real Supabase accessories render, tag filters open a populated catalog search, Ropa remains honest when empty, and browser console/network logs remain clean.

- [ ] **Step 4: Promote only the verified commit**

Record the final commit SHA and Preview URL. Merge or promote that exact SHA to Production only after the Preview checks pass; then smoke-test `https://www.fytherstore.com/`, `/catalogo?categoria=Accesorios`, one product detail and the cart.
