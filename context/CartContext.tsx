'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine, CommerceProduct, CommerceVariant, Money } from '@/lib/commerce/types'

const STORAGE_KEY = 'fyther-cart-v1'

interface CartContextValue {
  items: CartLine[]
  count: number
  subtotal: Money
  addProduct: (product: CommerceProduct, variant: CommerceVariant | null, quantity: number) => void
  setQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function productKey(productId: string, variantId: string | null): string {
  return `${productId}|${variantId ?? ''}`
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false
  const line = value as Partial<CartLine>
  return Boolean(line.key && line.productId && line.name && line.unitPrice?.currency === 'CRC')
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
      if (Array.isArray(parsed)) setItems(parsed.filter(isCartLine))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* storage may be unavailable */ }
  }, [hydrated, items])

  const addProduct = (product: CommerceProduct, variant: CommerceVariant | null, quantity: number) => {
    const key = productKey(product.id, variant?.id ?? null)
    const maxQuantity = Math.max(0, variant?.stockQuantity ?? product.stockQuantity)
    if (maxQuantity === 0) return
    const requested = Math.max(1, Math.floor(quantity))
    setItems((current) => {
      const index = current.findIndex((line) => line.key === key)
      if (index >= 0) {
        const next = [...current]
        next[index] = { ...next[index], quantity: Math.min(maxQuantity, next[index].quantity + requested) }
        return next
      }
      const unitPrice = variant?.price ?? product.price
      return [...current, {
        key,
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        variantName: variant?.name ?? null,
        image: (variant?.images[0] ?? product.images[0])?.src ?? null,
        quantity: Math.min(maxQuantity, requested),
        slug: product.slug,
        unitPrice,
        maxQuantity,
      }]
    })
  }

  const setQuantity = (key: string, quantity: number) => {
    setItems((current) => current.map((line) => line.key === key
      ? { ...line, quantity: Math.min(line.maxQuantity, Math.max(1, Math.floor(quantity))) }
      : line))
  }

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0)
    const amount = items.reduce((sum, line) => sum + line.unitPrice.amount * line.quantity, 0)
    return {
      items,
      count,
      subtotal: { amount, currency: 'CRC' },
      addProduct,
      setQuantity,
      removeItem: (key) => setItems((current) => current.filter((line) => line.key !== key)),
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return context
}
