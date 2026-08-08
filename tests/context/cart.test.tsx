import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CartProvider, useCart } from '@/context/CartContext'
import { demoProducts } from '@/lib/commerce/demo'

describe('CartProvider', () => {
  beforeEach(() => localStorage.clear())

  it('merges identical lines and clamps quantity to stock', () => {
    const product = demoProducts[0]
    const variant = product.variants[0]
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })

    act(() => result.current.addProduct(product, variant, 1))
    act(() => result.current.addProduct(product, variant, 5))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(variant.stockQuantity)
  })

  it('removes a line when requested', () => {
    const product = demoProducts[1]
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => result.current.addProduct(product, null, 1))
    act(() => result.current.removeItem(result.current.items[0].key))
    expect(result.current.items).toHaveLength(0)
  })
})
