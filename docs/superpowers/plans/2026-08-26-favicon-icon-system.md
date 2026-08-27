# Fyther Favicon and Icon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete Fyther browser, Apple, and installable icon family that preserves the approved neon lettering, is generated reproducibly, and is published correctly by Next.js.

**Architecture:** A focused Node/Sharp script derives the small `F` monogram and compact `FYTHER` wordmark from the committed approved logo, composites them onto the opaque Fyther night background, and writes every PNG plus a three-frame ICO. Next.js App Router metadata files publish those assets, while Vitest verifies image contracts and Playwright verifies the generated browser document and routes.

**Tech Stack:** Next.js 15 App Router metadata conventions, TypeScript, Node.js ESM, Sharp 0.35, Vitest 4, Playwright 1.62.

---

## File Map

- Create `scripts/prepare-fyther-icons.mjs`: sole icon generator and ICO packer.
- Create `tests/icon-system.test.ts`: raster and ICO binary contracts.
- Create `app/manifest.ts`: installable metadata and stable public icon URLs.
- Create `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`: App Router metadata assets.
- Create `public/icons/favicon-16.png`, `public/icons/favicon-32.png`, `public/icons/fyther-192.png`, `public/icons/fyther-512.png`, `public/icons/fyther-maskable-512.png`: explicit browser and manifest assets.
- Modify `package.json`: add the reproducible `assets:icons` command.
- Modify `app/layout.tsx`: add typed dark viewport configuration without changing current metadata or Open Graph artwork.
- Modify `tests/metadata.test.ts`: pin viewport and manifest contracts.
- Modify `e2e/store.spec.ts`: verify browser metadata links and every public icon route.

### Task 1: Define the icon asset contract

**Files:**
- Create: `tests/icon-system.test.ts`

- [ ] **Step 1: Write the failing raster and ICO tests**

Create `tests/icon-system.test.ts` with contracts for:

```ts
const pngAssets = [
  { path: 'app/icon.png', width: 512, height: 512, maxBytes: 350_000 },
  { path: 'app/apple-icon.png', width: 180, height: 180, maxBytes: 120_000 },
  { path: 'public/icons/favicon-16.png', width: 16, height: 16, maxBytes: 8_000 },
  { path: 'public/icons/favicon-32.png', width: 32, height: 32, maxBytes: 16_000 },
  { path: 'public/icons/fyther-192.png', width: 192, height: 192, maxBytes: 120_000 },
  { path: 'public/icons/fyther-512.png', width: 512, height: 512, maxBytes: 350_000 },
  { path: 'public/icons/fyther-maskable-512.png', width: 512, height: 512, maxBytes: 350_000 },
]
```

For every PNG, use Sharp metadata to assert `format === 'png'`, exact dimensions, `hasAlpha === false`, and the byte budget. Sample all four corner pixels and assert `[5, 6, 8]` so Apple and browser chrome cannot introduce white corners.

Parse `app/favicon.ico` with `Buffer.readUInt16LE/readUInt32LE`: reserved word `0`, type `1`, count `3`, and frames `16x16`, `32x32`, `48x48`. Assert every frame offset and byte count stays inside the file and total size is below 100 KB.

- [ ] **Step 2: Verify the test is red**

Run: `npm test -- tests/icon-system.test.ts`

Expected: FAIL with `ENOENT` for `app/icon.png` because the family does not exist.

- [ ] **Step 3: Commit the contract**

```bash
git add tests/icon-system.test.ts
git commit -m "test: define Fyther icon asset contract"
```

### Task 2: Build the deterministic icon generator

**Files:**
- Create: `scripts/prepare-fyther-icons.mjs`
- Modify: `package.json`
- Create: `app/favicon.ico`
- Create: `app/icon.png`
- Create: `app/apple-icon.png`
- Create: `public/icons/favicon-16.png`
- Create: `public/icons/favicon-32.png`
- Create: `public/icons/fyther-192.png`
- Create: `public/icons/fyther-512.png`
- Create: `public/icons/fyther-maskable-512.png`
- Test: `tests/icon-system.test.ts`

- [ ] **Step 1: Add the generator command**

Add beside `build` in `package.json`:

```json
"assets:icons": "node scripts/prepare-fyther-icons.mjs"
```

- [ ] **Step 2: Implement source extraction**

Create `scripts/prepare-fyther-icons.mjs` with these fixed inputs and color tokens:

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, 'public/logo1.png')
const NIGHT = { r: 5, g: 6, b: 8 }
const CYAN = { r: 110, g: 239, b: 242 }
const PINK = { r: 240, g: 108, b: 203 }
const SOURCE_FYTHER = { left: 125, top: 310, width: 1004, height: 430 }
const SOURCE_MONOGRAM = { left: 140, top: 310, width: 180, height: 430 }
```

Implement `neonMask(region)` by extracting the region from `SOURCE`, reading RGB pixels, assigning `CYAN` to the output RGB, and deriving alpha as `clamp((max(r,g,b) - 10) * 3, 0, 255)`. Trim transparent edges. This preserves the exact approved letter silhouettes while removing the source's black field.

- [ ] **Step 3: Implement fixed layouts**

Implement `placeMark({ mark, size, widthRatio, output, accent })` on a three-channel `NIGHT` canvas. Center a Sharp `contain` resize; monograms use `widthRatio: 0.58` and maximum height `70%`, while wordmarks use maximum height `28%`. For 16/32 monograms, composite a solid `PINK` square sized `12%` at the lower-right inside `10%` edge clearance.

Generate:

```js
await Promise.all([
  placeMark({ mark: monogram, size: 16, widthRatio: 0.58, output: 'public/icons/favicon-16.png', accent: true }),
  placeMark({ mark: monogram, size: 32, widthRatio: 0.58, output: 'public/icons/favicon-32.png', accent: true }),
  placeMark({ mark: wordmark, size: 48, widthRatio: 0.75, output: '.superpowers/generated-assets/favicon-48.png' }),
  placeMark({ mark: wordmark, size: 180, widthRatio: 0.75, output: 'app/apple-icon.png' }),
  placeMark({ mark: wordmark, size: 192, widthRatio: 0.75, output: 'public/icons/fyther-192.png' }),
  placeMark({ mark: wordmark, size: 512, widthRatio: 0.75, output: 'app/icon.png' }),
  placeMark({ mark: wordmark, size: 512, widthRatio: 0.75, output: 'public/icons/fyther-512.png' }),
  placeMark({ mark: wordmark, size: 512, widthRatio: 0.66, output: 'public/icons/fyther-maskable-512.png' }),
])
```

Resolve every output against `ROOT`, create its parent recursively, and write PNG with compression level 9 and no palette/alpha. The `0.75` standard ratio enforces 12.5% side clearance; `0.66` keeps the maskable wordmark inside the central safe zone.

- [ ] **Step 4: Implement the ICO packer**

Implement `buildIco(frames)` with a six-byte ICONDIR header, one sixteen-byte ICONDIRENTRY per PNG, planes `1`, bit count `32`, then concatenate the unmodified PNG buffers. Use the generated 16, 32, and 48 px buffers in ascending order and write the result to `app/favicon.ico`.

- [ ] **Step 5: Generate and verify assets**

Run:

```bash
npm run assets:icons
npm test -- tests/icon-system.test.ts
```

Expected: generation exits `0`; all PNG cases and the ICO contract pass.

- [ ] **Step 6: Inspect artwork at native size**

Create a temporary Sharp contact sheet with nearest-neighbor 16/32 px previews, the 180/192/512 assets at native size, and a centered circular crop over the maskable asset. Accept only when the small `F` is crisp, the pink accent remains separate, the six letters of `FYTHER` match the source, no `STORE` pixels appear, and maskable cropping removes no letter. If needed, adjust only `SOURCE_FYTHER` and `SOURCE_MONOGRAM`; do not redraw lettering.

- [ ] **Step 7: Prove reproducibility and commit**

Run `npm run assets:icons` a second time. After staging the generated files, `git diff --exit-code --cached` must be stable across repeated runs.

```bash
git add package.json scripts/prepare-fyther-icons.mjs app/favicon.ico app/icon.png app/apple-icon.png public/icons tests/icon-system.test.ts
git commit -m "feat: add Fyther adaptive icon family"
```

### Task 3: Publish Next.js metadata

**Files:**
- Create: `app/manifest.ts`
- Modify: `app/layout.tsx`
- Modify: `tests/metadata.test.ts`

- [ ] **Step 1: Add failing metadata tests**

Import `manifest` from `@/app/manifest` in `tests/metadata.test.ts`. Assert `layoutSource` imports `Metadata, Viewport`, includes `themeColor: '#050608'` and `colorScheme: 'dark'`, and does not include an `icons:` metadata property. Assert `manifest()` matches the complete object added in Step 3.

- [ ] **Step 2: Confirm red state**

Run: `npm test -- tests/metadata.test.ts`

Expected: FAIL because `app/manifest.ts` and the viewport export do not exist.

- [ ] **Step 3: Create the web manifest**

Create `app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fyther Store',
    short_name: 'Fyther',
    description: 'Ropa y accesorios deportivos originales para moverte a tu manera.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050608',
    theme_color: '#050608',
    lang: 'es-CR',
    icons: [
      { src: '/icons/fyther-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/fyther-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/fyther-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

- [ ] **Step 4: Add typed viewport configuration**

In `app/layout.tsx`, change the type import and add this export before `metadata`:

```ts
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050608',
}
```

Do not add an `icons` property to `metadata`; App Router special files own those declarations. Do not alter the current Open Graph image.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/metadata.test.ts
npm run typecheck
git add app/manifest.ts app/layout.tsx tests/metadata.test.ts
git commit -m "feat: publish Fyther installable metadata"
```

Expected: tests pass and the installed Next.js types accept each manifest field and purpose.

### Task 4: Verify browser discovery and production routes

**Files:**
- Modify: `e2e/store.spec.ts`

- [ ] **Step 1: Add the E2E contract**

Add `test('publishes the complete Fyther icon system', ...)` following existing file conventions. Navigate to `/` and assert exactly one favicon link containing `favicon.ico`, one icon link containing `icon.png`, one `apple-touch-icon`, one `manifest` link ending in `manifest.webmanifest`, and `meta[name="theme-color"]` content `#050608`.

Using Playwright's `request`, assert status `200` for:

```ts
const routes = [
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/manifest.webmanifest',
  '/icons/favicon-16.png',
  '/icons/favicon-32.png',
  '/icons/fyther-192.png',
  '/icons/fyther-512.png',
  '/icons/fyther-maskable-512.png',
]
```

Keep metadata image selectors substring-based because Next.js may append content hashes.

- [ ] **Step 2: Build and run the focused browser test**

```bash
npm run build
npx playwright test e2e/store.spec.ts --grep "complete Fyther icon system"
```

Expected: build lists the manifest and metadata image routes; the focused test passes in every configured browser project.

- [ ] **Step 3: Commit the browser contract**

```bash
git add e2e/store.spec.ts
git commit -m "test: verify Fyther icon discovery"
```

### Task 5: Quality gate, merge, and delivery

**Files:**
- Verify all files changed in Tasks 1-4.

- [ ] **Step 1: Run the full gate**

```bash
npm run assets:icons
git diff --exit-code
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:dead-code
npm audit --audit-level=high
npm run test:e2e
```

Expected: every command exits `0`; regeneration produces no diff; Knip reports no unused files/exports; npm reports zero high/critical vulnerabilities.

- [ ] **Step 2: Review scope and visual output**

Inspect the browser tab at desktop/mobile widths, Apple 180 px preview, installable 192/512 previews, and circular maskable crop. Confirm that the smallest tab uses `F`, larger assets spell `FYTHER`, all use cyan/pink/night, no unrelated imagery was introduced, and existing page/Open Graph presentation is unchanged.

Run `git status --short` and `git diff main...HEAD --stat`; remove no user work. Ensure no `.next`, contact sheets, secret files, or temporary inspection assets are tracked.

- [ ] **Step 3: Merge and push main**

```bash
git switch main
git merge --no-ff codex/favicon-icon-system -m "feat: deliver Fyther icon system"
git push origin main
git rev-parse main
git rev-parse origin/main
```

Expected: local and remote `main` hashes match.

- [ ] **Step 4: Verify Vercel production**

Wait for the production deployment triggered by `main`. Verify `https://www.fytherstore.com/`, `/favicon.ico`, `/apple-icon.png`, `/manifest.webmanifest`, and every manifest icon route return `200`; production markup includes icon/manifest/theme links; the live tab shows the Fyther `F`.

## Self-Review

- **Spec coverage:** Tasks 1-2 cover adaptive artwork, exact sizes, opaque background, standard clear space, ICO frames, and maskable safety. Task 3 covers App Router metadata, Spanish manifest, dark theme, and Open Graph preservation. Task 4 covers generated links and routes. Task 5 covers visual regression, complete quality, main synchronization, and production.
- **Placeholder scan:** No implementation is deferred. Visual adjustment is restricted to two explicit source crop constants with measurable acceptance conditions.
- **Type consistency:** Manifest fields match `MetadataRoute.Manifest`; test routes match generated files and manifest URLs; `Viewport` is imported and exported using Next.js types.
