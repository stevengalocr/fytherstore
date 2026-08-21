# Product-Only Editorial Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Fyther's hero and footer campaign photography with responsive, product-only editorial images that contain no human elements and preserve the Fyther F-and-star hero identity.

**Architecture:** Generate three versioned raster sources: desktop hero, mobile hero, and footer. Keep presentation behavior in the existing `HeroMedia` and `Footer` components, update metadata and asset contracts, and verify actual crops in Playwright rather than introducing new runtime image logic.

**Tech Stack:** Next.js 15, React 19, TypeScript, `next/image`, Sharp, Vitest, Playwright, Knip, Vercel.

---

### Task 1: Define the new asset contract

**Files:**
- Modify: `tests/assets.test.ts`
- Modify: `tests/components/hero-media.test.tsx`
- Modify: `tests/components/header.test.tsx`
- Modify: `tests/metadata.test.ts`

- [ ] **Step 1: Write failing source-path and metadata assertions**

Change the expected sources to:

```ts
'/editorial/hero-product-campaign-v3.webp'
'/editorial/hero-product-campaign-v3-mobile.webp'
'/editorial/footer-product-campaign-v3.webp'
```

Require the hero alternative text to describe the Fyther plaque, sportswear, and accessories. Require the footer alternative text to describe only products, with no reference to women or people.

- [ ] **Step 2: Write failing binary asset assertions**

Add these contracts to `tests/assets.test.ts`:

```ts
{ path: 'public/editorial/hero-product-campaign-v3.webp', width: 1920, height: 1080, hasAlpha: false, maxBytes: 700_000 }
{ path: 'public/editorial/hero-product-campaign-v3-mobile.webp', width: 1200, height: 1500, hasAlpha: false, maxBytes: 700_000 }
{ path: 'public/editorial/footer-product-campaign-v3.webp', width: 1920, height: 1080, hasAlpha: false, maxBytes: 700_000 }
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```powershell
npx vitest run tests/assets.test.ts tests/components/hero-media.test.tsx tests/components/header.test.tsx tests/metadata.test.ts
```

Expected: failures for missing v3 assets and old component source paths.

### Task 2: Generate and optimize the product-only campaign

**Files:**
- Create: `public/editorial/hero-product-campaign-v3.webp`
- Create: `public/editorial/hero-product-campaign-v3-mobile.webp`
- Create: `public/editorial/footer-product-campaign-v3.webp`

- [ ] **Step 1: Generate the desktop hero from the approved hero reference**

Use the current branded suitcase as a composition and identity reference. Require an open suitcase containing leggings, sports bra, technical top, sneakers, gym bag, bottle, resistance bands, towel, cap, and small training accessories. Preserve the F-and-star plaque, reserve left-side copy space, and prohibit people, bodies, hands, skin, silhouettes, mannequins, third-party logos, labels, and watermarks.

- [ ] **Step 2: Generate the mobile hero as a dedicated composition**

Use the selected desktop result as visual reference, but compose natively for 4:5. Keep the plaque and key product categories visible through the mobile hero crop, with readable dark space for the existing copy.

- [ ] **Step 3: Generate the footer product scene**

Create a distinct premium studio or locker-room still life with folded women's activewear, open gym bag, sneakers, bottle, towel, resistance bands, cap, and compact accessories. Match cyan, restrained pink, dark graphite, and warm-metal lighting. Prohibit every human element and all text or third-party branding.

- [ ] **Step 4: Optimize exact WebP outputs**

Use Sharp to resize with cover cropping and encode WebP at a visually lossless quality target:

```js
sharp(source).resize(1920, 1080, { fit: 'cover' }).webp({ quality: 88, effort: 6 })
sharp(source).resize(1200, 1500, { fit: 'cover' }).webp({ quality: 88, effort: 6 })
```

- [ ] **Step 5: Inspect all three outputs visually**

View each optimized file at native dimensions. Reject any output containing anatomy, reflections of people, malformed garments, invented words, incoherent shoes, or a distorted Fyther plaque.

### Task 3: Integrate the versioned assets

**Files:**
- Modify: `components/site/HeroMedia.tsx`
- Modify: `components/Footer.tsx`
- Modify: `app/layout.tsx`
- Modify: `tests/components/hero-media.test.tsx`
- Modify: `tests/components/header.test.tsx`
- Modify: `tests/metadata.test.ts`

- [ ] **Step 1: Update the hero picture sources and alternative text**

Use:

```tsx
<source media="(max-width: 767px)" srcSet="/editorial/hero-product-campaign-v3-mobile.webp" />
<Image
  src="/editorial/hero-product-campaign-v3.webp"
  alt="Maleta Fyther abierta con prendas, calzado y accesorios deportivos"
  fill
  priority
  sizes="100vw"
/>
```

- [ ] **Step 2: Update the footer source and alternative text**

Use:

```tsx
<Image
  src="/editorial/footer-product-campaign-v3.webp"
  alt="Prendas, calzado y accesorios deportivos preparados para entrenar"
  width={1920}
  height={1080}
  sizes="(max-width: 767px) calc(100vw - 32px), 56vw"
/>
```

- [ ] **Step 3: Update Open Graph metadata**

Point `metadata.openGraph.images[0].url` to `/editorial/hero-product-campaign-v3.webp` and preserve its 1920x1080 dimensions.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
npx vitest run tests/assets.test.ts tests/components/hero-media.test.tsx tests/components/header.test.tsx tests/metadata.test.ts
```

Expected: all focused tests pass.

### Task 4: Verify responsive composition and accessibility

**Files:**
- Modify: `e2e/store.spec.ts`
- Create through Playwright: `test-results/review-product-only-*.png`

- [ ] **Step 1: Update the responsive hero E2E source assertions**

Expect the desktop and mobile `currentSrc` values to contain the corresponding v3 filenames. Assert that the homepage contains no image alternative text matching `/amigas|mujeres|personas|modelo/i`.

- [ ] **Step 2: Add a footer product-image assertion**

Verify `.footer-media img` loads, its source contains `footer-product-campaign-v3.webp`, and its alternative text matches `/prendas.*accesorios/i`.

- [ ] **Step 3: Capture representative screenshots**

Capture hero and footer at 1440x900, 768x1024, 390x844, and 320x568. Inspect plaque visibility, product legibility, hero copy contrast, footer crop, and horizontal overflow.

- [ ] **Step 4: Run E2E verification**

Run:

```powershell
npm run test:e2e
```

Expected: all applicable projects pass; configured skips remain intentional.

### Task 5: Complete quality gates and publish

**Files:**
- Modify only if verification reveals a scoped issue.

- [ ] **Step 1: Run repository quality gates**

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:dead-code
npm audit --audit-level=high
git diff --check
```

Expected: every command exits zero, all tests pass, Knip reports no findings, and npm reports zero high-severity vulnerabilities.

- [ ] **Step 2: Commit the implementation**

```powershell
git add -A
git commit -m "feat: use product-only campaign imagery"
```

- [ ] **Step 3: Push, fast-forward main, and publish**

```powershell
git push -u origin codex/product-only-editorial-images
git switch main
git pull --ff-only
git merge --ff-only codex/product-only-editorial-images
git push origin main
```

- [ ] **Step 4: Verify Vercel production**

Wait for the new production deployment to report `Ready`. Request `https://www.fytherstore.com/` with a cache-busting query and confirm HTTP 200, all three v3 asset paths in production, no `<video>` tag, and direct HTTP 200 responses for each image.
