import { describe, expect, it } from 'vitest'
import { createDemoOrder } from '@/lib/commerce/demo-orders'
import { demoCommerce } from '@/lib/commerce/demo'
import type { CheckoutInput } from '@/lib/commerce/types'

const validCheckoutInput: CheckoutInput = {
  items: [{
    productId: 'demo-motion-tee',
    variantId: null,
    name: 'Motion Tee',
    variantName: null,
    image: '/home.jpeg',
    quantity: 1,
  }],
  customer: { name: 'Cliente Demo', email: 'demo@example.com', phone: '8888-8888' },
  address: { address: 'San José', city: 'San José', country: 'Costa Rica', notes: '' },
  paymentMethod: 'demo',
}

describe('demo commerce', () => {
  it('exposes a catalog explicitly marked as demo with CRC prices', async () => {
    const products = await demoCommerce.getProducts()
    expect(products.length).toBeGreaterThan(0)
    expect(products.every(product => product.demo && product.price.currency === 'CRC')).toBe(true)
  })

  it('returns a product by slug', async () => {
    const product = await demoCommerce.getProductBySlug('motion-tee')
    expect(product?.id).toBe('demo-motion-tee')
  })

  it('creates an isolated demo order with tracking', () => {
    const order = createDemoOrder(validCheckoutInput, new Date('2026-08-08T12:00:00Z'))
    expect(order.id).toMatch(/^demo-/)
    expect(order.demo).toBe(true)
    expect(order.tracking[0].status).toBe('pending')
  })

  it('rejects unavailable quantities', () => {
    expect(() => createDemoOrder({
      ...validCheckoutInput,
      items: [{ ...validCheckoutInput.items[0], quantity: 99 }],
    })).toThrow(/cantidad/i)
  })
})
