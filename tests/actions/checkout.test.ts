import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrder } from '@/app/actions/checkout'
import type { CheckoutInput } from '@/lib/commerce/types'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase-server', () => ({
  createServiceClient: () => ({ rpc }),
  getServerBusinessId: () => '11111111-1111-4111-8111-111111111111',
}))

const input: CheckoutInput = {
  idempotencyKey: '22222222-2222-4222-8222-222222222222',
  items: [{
    productId: '33333333-3333-4333-8333-333333333333',
    variantId: '44444444-4444-4444-8444-444444444444',
    name: 'Legging Flujo',
    variantName: 'M',
    image: '/legging.jpg',
    quantity: 2,
  }],
  customer: { name: '  Steven  ', email: ' Steven@Example.com ', phone: '8888-8888' },
  address: { address: ' San Jose ', city: 'San Jose', country: 'Costa Rica', notes: '' },
  paymentMethod: 'link',
  acceptedTerms: false,
}

describe('createOrder', () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('FYTHER_E2E_COMMERCE_FIXTURE', '')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('delegates the complete order to the atomic idempotent RPC', async () => {
    rpc.mockResolvedValue({
      data: {
        orderId: '55555555-5555-4555-8555-555555555555',
        orderNumber: 'FY-20260808-ABC12345',
        status: 'pending',
        total: 57800,
        currency: 'CRC',
      },
      error: null,
    })

    await expect(createOrder(input)).resolves.toEqual({
      ok: true,
      mode: 'live',
      orderId: '55555555-5555-4555-8555-555555555555',
    })
    expect(rpc).toHaveBeenCalledWith('create_fyther_storefront_order', {
      p_business_id: '11111111-1111-4111-8111-111111111111',
      p_idempotency_key: input.idempotencyKey,
      p_payload: {
        items: [{
          product_id: input.items[0].productId,
          variant_id: input.items[0].variantId,
          quantity: 2,
        }],
        customer: { name: 'Steven', email: 'steven@example.com', phone: '8888-8888' },
        shipping_address: { address: 'San Jose', city: 'San Jose', country: 'Costa Rica', notes: '' },
        payment_method: 'link',
        accepted_terms: false,
      },
    })
  })

  it.each([
    ['bad idempotency key', { ...input, idempotencyKey: 'retry-me' }],
    ['empty cart', { ...input, items: [] }],
    ['bad product id', { ...input, items: [{ ...input.items[0], productId: 'product-1' }] }],
    ['bad variant id', { ...input, items: [{ ...input.items[0], variantId: 'variant-1' }] }],
    ['bad quantity', { ...input, items: [{ ...input.items[0], quantity: 0 }] }],
    ['bad email', { ...input, customer: { ...input.customer, email: 'correo@' } }],
    ['oversized address', { ...input, address: { ...input.address, address: 'a'.repeat(301) } }],
    ['oversized city', { ...input, address: { ...input.address, city: 'a'.repeat(121) } }],
    ['oversized country', { ...input, address: { ...input.address, country: 'a'.repeat(81) } }],
    ['oversized notes', { ...input, address: { ...input.address, notes: 'a'.repeat(501) } }],
  ])('rejects %s before calling BilBildin', async (_label, malformed) => {
    const result = await createOrder(malformed as CheckoutInput)

    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('maps database failures to customer-safe messages', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'insufficient_stock CONTEXT private row data' } })

    await expect(createOrder(input)).resolves.toEqual({
      ok: false,
      mode: 'live',
      error: 'Una de tus prendas ya no tiene suficiente disponibilidad.',
    })
  })

  // Los ocho códigos públicos de `crear_pedido` (bilbildin/lib/errores-pedido.ts)
  // más los dos nombres propios que la puerta `create_fyther_storefront_order`
  // traduce para esta tienda (`variant_unavailable`, `invalid_checkout_payload`).
  // Cada uno tiene que llegar al comprador con un texto propio: ninguno cae al
  // mensaje genérico salvo `internal_error`, que a propósito no explica nada.
  it.each([
    ['store_not_active', 'Esta tienda no está aceptando pedidos en este momento.'],
    ['product_unavailable', 'Una de tus prendas ya no está disponible. Revisa tu carrito.'],
    ['variant_unavailable', 'Una de tus prendas ya no está disponible. Revisa tu carrito.'],
    ['invalid_product', 'Una de tus prendas ya no está disponible. Revisa tu carrito.'],
    ['insufficient_stock', 'Una de tus prendas ya no tiene suficiente disponibilidad.'],
    ['purchase_limit_exceeded', 'Una de tus prendas supera la cantidad máxima por pedido. Reduce la cantidad e intenta de nuevo.'],
    ['temporarily_unavailable', 'No pudimos confirmar el pedido en este momento. Espera unos segundos e intenta de nuevo.'],
    ['invalid_request', 'Revisa tus datos y vuelve a intentar.'],
    ['invalid_checkout_payload', 'Revisa tus datos y vuelve a intentar.'],
    ['invalid_customer_details', 'Revisa tus datos y vuelve a intentar.'],
    ['invalid_payment_method', 'El método de pago seleccionado ya no está disponible.'],
    ['internal_error', 'No pudimos confirmar el pedido. Intenta de nuevo.'],
  ])('translates the BilBildin code %s thrown by the gate', async (code, message) => {
    rpc.mockResolvedValue({ data: null, error: { message: `${code} CONTEXT: PL/pgSQL function` } })

    await expect(createOrder(input)).resolves.toEqual({ ok: false, mode: 'live', error: message })
  })

  it('treats a returned { code } (the crear_pedido shape) like a thrown code', async () => {
    rpc.mockResolvedValue({ data: { code: 'purchase_limit_exceeded', error: 'detalle interno' }, error: null })

    await expect(createOrder(input)).resolves.toEqual({
      ok: false,
      mode: 'live',
      error: 'Una de tus prendas supera la cantidad máxima por pedido. Reduce la cantidad e intenta de nuevo.',
    })
  })

  it('sends accepted_terms only when the customer accepted them', async () => {
    rpc.mockResolvedValue({ data: { orderId: '55555555-5555-4555-8555-555555555555' }, error: null })

    await createOrder({ ...input, acceptedTerms: true })
    expect(rpc).toHaveBeenLastCalledWith('create_fyther_storefront_order', expect.objectContaining({
      p_payload: expect.objectContaining({ accepted_terms: true }),
    }))

    await createOrder({ ...input, acceptedTerms: false })
    expect(rpc).toHaveBeenLastCalledWith('create_fyther_storefront_order', expect.objectContaining({
      p_payload: expect.objectContaining({ accepted_terms: false }),
    }))
  })

  it('does not expose active commerce configuration language to customers', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'La configuración de compra en vivo está incompleta.' },
    })

    const result = await createOrder(input)

    expect(result).toEqual({
      ok: false,
      mode: 'live',
      error: 'No pudimos confirmar el pedido. Intenta de nuevo.',
    })
    expect(result.error).not.toMatch(/bilbildin|modo live|configuraci[oó]n|configurad[oa]s?/i)
  })

  it('rejects an invalid RPC response without exposing integration details', async () => {
    rpc.mockResolvedValue({ data: { orderId: 'not-an-order-id' }, error: null })

    await expect(createOrder(input)).resolves.toEqual({
      ok: false,
      mode: 'live',
      error: 'No pudimos confirmar el pedido. Intenta de nuevo.',
    })
  })

  it('submits fixture inventory through the guarded provider without a broad RPC bypass', async () => {
    vi.stubEnv('FYTHER_E2E_COMMERCE_FIXTURE', 'live')
    rpc.mockRejectedValue(new Error('Supabase must not be called for the fixture'))

    await expect(createOrder({
      ...input,
      items: [{
        ...input.items[0],
        productId: '10000000-0000-4000-8000-000000000001',
        variantId: '20000000-0000-4000-8000-000000000002',
        name: 'Accesorio Fyther Uno',
        variantName: 'Cian',
        quantity: 1,
      }],
      paymentMethod: 'cash',
    })).resolves.toEqual({
      ok: true,
      mode: 'live',
      orderId: '40000000-0000-4000-8000-000000000001',
    })
    expect(rpc).not.toHaveBeenCalled()
  })
})
