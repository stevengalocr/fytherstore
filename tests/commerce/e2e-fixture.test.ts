import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

function stubCommerceEnv(fixture: string) {
  vi.stubEnv('FYTHER_E2E_COMMERCE_FIXTURE', fixture)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
  vi.stubEnv('NEXT_PUBLIC_BUSINESS_ID', '')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
}

function stubConfiguredCommerceEnv() {
  vi.stubEnv('FYTHER_E2E_COMMERCE_FIXTURE', '')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key')
  vi.stubEnv('NEXT_PUBLIC_BUSINESS_ID', '11111111-1111-4111-8111-111111111111')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
}

describe('configured E2E commerce fixture', () => {
  beforeEach(() => vi.resetModules())

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('selects deterministic live Accesorios data only for the exact live switch', async () => {
    stubCommerceEnv('live')

    const { commerce, commerceMode } = await import('@/lib/commerce')
    const products = await commerce.getProducts()

    expect(commerceMode).toBe('live')
    expect(products.map(({ id, slug }) => ({ id, slug }))).toEqual([
      { id: 'fyther-e2e-accesorio-01', slug: 'accesorio-fyther-uno' },
      { id: 'fyther-e2e-accesorio-02', slug: 'accesorio-fyther-dos' },
      { id: 'fyther-e2e-accesorio-03', slug: 'accesorio-fyther-tres' },
    ])
    expect(products.every(({ category }) => category === 'Accesorios')).toBe(true)
    expect(products.some(({ category }) => category === 'Ropa')).toBe(false)
    expect(products.map(({ price }) => price)).toEqual([
      { amount: 15000, currency: 'CRC' },
      { amount: 18000, currency: 'CRC' },
      { amount: 12000, currency: 'CRC' },
    ])
    expect(products.flatMap(({ images }) => images.map(({ src }) => src))).toEqual(['/ropa.png', '/modelo2.png', '/home.jpeg'])
    expect(products.map(({ tags }) => tags)).toEqual([
      ['Botellas', 'Gym'],
      ['Gym', 'Organización'],
      ['Regalos'],
    ])
    expect(products[2]).toMatchObject({
      name: 'Accesorio Fyther Tres',
      shortDescription: 'Un detalle para tu rutina diaria',
      price: { amount: 12000, currency: 'CRC' },
      images: [{ src: '/home.jpeg', alt: 'Accesorio Fyther Tres' }],
      availability: 'in_stock',
      stockQuantity: 2,
      featured: false,
    })

    await expect(commerce.getProductBySlug('accesorio-fyther-dos')).resolves.toEqual(products[1])
    await expect(commerce.getProductBySlug('no-existe')).resolves.toBeNull()
  })

  it('preserves unconfigured production behavior for non-exact fixture values', async () => {
    stubCommerceEnv('LIVE')

    const { commerce, commerceMode } = await import('@/lib/commerce')

    expect(commerceMode).toBe('unconfigured')
    await expect(commerce.getProducts()).resolves.toEqual([])
    await expect(commerce.getProductBySlug('accesorio-fyther-uno')).resolves.toBeNull()
  })

  it('preserves the BilBildin adapter when production commerce is configured', async () => {
    stubConfiguredCommerceEnv()

    const { bilBildinCommerce } = await import('@/lib/commerce/bilbildin')
    const { commerce, commerceMode } = await import('@/lib/commerce')

    expect(commerceMode).toBe('live')
    expect(commerce).toBe(bilBildinCommerce)
  })
})
