import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

function stubCommerceEnv(fixture: string) {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('FYTHER_E2E_COMMERCE_FIXTURE', fixture)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
  vi.stubEnv('NEXT_PUBLIC_BUSINESS_ID', '')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
}

function stubConfiguredCommerceEnv() {
  vi.stubEnv('NODE_ENV', 'test')
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
      { id: '10000000-0000-4000-8000-000000000001', slug: 'accesorio-fyther-uno' },
      { id: '10000000-0000-4000-8000-000000000002', slug: 'accesorio-fyther-dos' },
      { id: '10000000-0000-4000-8000-000000000003', slug: 'accesorio-fyther-tres' },
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
    expect(products[0].variants).toEqual([
      expect.objectContaining({
        id: '20000000-0000-4000-8000-000000000001',
        name: 'Rosa',
        stockQuantity: 3,
      }),
      expect.objectContaining({
        id: '20000000-0000-4000-8000-000000000002',
        name: 'Cian',
        stockQuantity: 2,
      }),
    ])

    await expect(commerce.getProductBySlug('accesorio-fyther-dos')).resolves.toEqual(products[1])
    await expect(commerce.getProductBySlug('no-existe')).resolves.toBeNull()
  })

  it('cannot activate fabricated commerce in a production build environment', async () => {
    stubCommerceEnv('live')
    vi.stubEnv('NODE_ENV', 'production')

    const { commerce, commerceMode } = await import('@/lib/commerce')

    expect(commerceMode).toBe('unconfigured')
    await expect(commerce.getProducts()).resolves.toEqual([])
    await expect(commerce.getProductBySlug('accesorio-fyther-uno')).resolves.toBeNull()
  })

  it('provides deterministic checkout, confirmation, and tracking only through the guarded provider', async () => {
    stubCommerceEnv('live')
    const fixtureModule = await import('@/lib/commerce/e2e-fixture')
    const getProvider = (fixtureModule as unknown as {
      getE2ECommerceFixtureProvider?: (env?: Record<string, string | undefined>) => unknown
    }).getE2ECommerceFixtureProvider

    expect(getProvider).toEqual(expect.any(Function))
    if (!getProvider) return

    expect(getProvider({ NODE_ENV: 'production', FYTHER_E2E_COMMERCE_FIXTURE: 'live' })).toBeNull()
    const provider = getProvider({
      NODE_ENV: 'test',
      FYTHER_E2E_COMMERCE_FIXTURE: 'live',
    }) as {
      checkoutMethods: Array<{ id: string }>
      createOrder(input: unknown): Promise<string>
      readOrder(orderId: string): Promise<unknown>
    }
    expect(provider.checkoutMethods).toEqual([
      expect.objectContaining({ id: 'cash' }),
    ])

    const orderId = await provider.createOrder({
      idempotencyKey: '30000000-0000-4000-8000-000000000001',
      items: [{
        productId: '10000000-0000-4000-8000-000000000001',
        variantId: '20000000-0000-4000-8000-000000000002',
        name: 'ignored customer value',
        variantName: 'ignored customer value',
        image: null,
        quantity: 1,
      }],
      customer: { name: 'Ana', email: 'ana@example.com', phone: '' },
      address: { address: 'San Jose', city: 'San Jose', country: 'Costa Rica', notes: '' },
      paymentMethod: 'cash',
    })

    expect(orderId).toBe('40000000-0000-4000-8000-000000000001')
    await expect(provider.readOrder(orderId)).resolves.toMatchObject({
      id: orderId,
      orderNumber: 'FY-E2E-0001',
      status: 'pending',
      paymentMethod: 'cash',
      lines: [expect.objectContaining({ name: 'Accesorio Fyther Uno - Cian', quantity: 1 })],
      tracking: [expect.objectContaining({ status: 'pending', title: 'Pedido recibido' })],
    })
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
