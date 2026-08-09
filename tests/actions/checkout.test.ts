import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrder } from '@/app/actions/checkout'
import type { CheckoutInput } from '@/lib/commerce/types'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

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
}

describe('createOrder', () => {
  beforeEach(() => rpc.mockReset())

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

  it('rejects an invalid RPC response without exposing integration details', async () => {
    rpc.mockResolvedValue({ data: { orderId: 'not-an-order-id' }, error: null })

    await expect(createOrder(input)).resolves.toEqual({
      ok: false,
      mode: 'live',
      error: 'No pudimos confirmar el pedido. Intenta de nuevo.',
    })
  })
})
