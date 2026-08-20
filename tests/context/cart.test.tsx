import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CartProvider, useCart } from '@/context/CartContext'
import type { CommerceProduct } from '@/lib/commerce/types'

const product: CommerceProduct = {
  id: 'product-1', slug: 'motion-tee', name: 'Motion Tee', brand: null, shortDescription: null,
  description: null, price: { amount: 18900, currency: 'CRC' }, compareAtPrice: null,
  images: [], availability: 'in_stock', stockQuantity: 5, category: 'Ropa', tags: [], featured: true,
  variants: [{ id: 'variant-1', name: 'Talla M', sku: null, price: { amount: 18900, currency: 'CRC' }, stockQuantity: 2, attributes: {}, images: [] }],
}

describe('CartProvider', () => {
  beforeEach(() => localStorage.clear())

  it('merges identical lines and clamps quantity to stock', () => {
    const variant = product.variants[0]
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })

    act(() => result.current.addProduct(product, variant, 1))
    act(() => result.current.addProduct(product, variant, 5))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(variant.stockQuantity)
  })

  it('removes a line when requested', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => result.current.addProduct(product, null, 1))
    act(() => result.current.removeItem(result.current.items[0].key))
    expect(result.current.items).toHaveLength(0)
  })
})
