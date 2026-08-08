# Fyther Store V1 Final Specification

## Objective

Deliver a production storefront for Fyther backed exclusively by BilBildin. Products, variants, prices, stock, payment methods, orders and tracking must come from the configured business. The application never publishes fictional commercial data.

## Experience

- Editorial high-performance direction using Bone, Obsidian and Volt.
- Full responsive journey across home, catalog, product, cart, checkout, confirmation and tracking.
- Archivo for display typography and Manrope for operational copy.
- Campaign photography and video are the primary visual material.
- Clear empty, unavailable and error states with no invented claims.

## Commerce Contract

```ts
type CommerceMode = 'unconfigured' | 'live'
```

- `live`: BilBildin is the only source of commercial truth.
- `unconfigured`: no product, price, checkout, order or tracking data is published.
- Public catalog reads use the Supabase anonymous key and always filter `business_id` and visible status.
- Checkout and order reads use the service role only in server modules.
- Client-submitted prices and stock are never trusted.
- Payment methods are rendered only when present in the business `theme_config`.

## Configuration

The live storefront requires:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUSINESS_ID`
- `SUPABASE_SERVICE_ROLE_KEY`

The service role must never be exposed with a `NEXT_PUBLIC_` prefix or committed to Git.

## Acceptance

- No fictional catalog or orders exist in the runtime.
- Missing credentials produce an honest non-commercial state.
- Live queries remain tenant-scoped.
- Desktop and mobile render without horizontal page overflow or framework errors.
- Lint, TypeScript, unit tests, Playwright, production build and dependency audit pass.
