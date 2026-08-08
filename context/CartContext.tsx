'use client'

// Carrito en localStorage — sin backend (regla de la integración BilBildin).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CartItem } from '@/lib/types'

const STORAGE_KEY = 'fyther-cart'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: CartItem) => void
  setQty: (key: string, delta: number) => void
  removeItem: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// Clave de línea: mismo producto + misma variante/personalización se agrupan.
export function lineKey(i: Pick<CartItem, 'product_id' | 'variant_id' | 'variant_name'>): string {
  return [i.product_id, i.variant_id ?? '', i.variant_name ?? ''].join('|')
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      if (Array.isArray(raw)) setItems(raw)
    } catch { /* carrito corrupto: se ignora */ }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* storage lleno */ }
  }, [items, loaded])

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const key = lineKey(item)
      const i = prev.findIndex(l => lineKey(l) === key)
      if (i >= 0) {
        const next = prev.slice()
        next[i] = { ...next[i], quantity: next[i].quantity + item.quantity }
        return next
      }
      return [...prev, item]
    })
  }

  const setQty = (key: string, delta: number) => {
    setItems(prev => prev.map(l =>
      lineKey(l) === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l
    ))
  }

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(l => lineKey(l) !== key))
  }

  const clear = () => setItems([])

  const count = items.reduce((t, l) => t + l.quantity, 0)
  const subtotal = items.reduce((t, l) => t + l.price * l.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, setQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
