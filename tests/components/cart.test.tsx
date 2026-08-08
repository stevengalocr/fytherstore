import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CartPage from '@/app/carrito/page'
import type { CartLine } from '@/lib/commerce/types'

const { cart, setQuantity, removeItem } = vi.hoisted(() => ({
  cart: {
    items: [] as CartLine[],
    subtotal: { amount: 28900, currency: 'CRC' as const },
  },
  setQuantity: vi.fn(),
  removeItem: vi.fn(),
}))

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ ...cart, setQuantity, removeItem }),
}))

const item: CartLine = {
  key: 'legging|s',
  productId: 'legging',
  variantId: 's',
  name: 'Legging Flujo',
  variantName: 'S',
  image: null,
  quantity: 1,
  slug: 'legging-flujo',
  unitPrice: { amount: 28900, currency: 'CRC' },
  maxQuantity: 2,
}

describe('CartPage', () => {
  beforeEach(() => {
    cart.items = [item]
    setQuantity.mockReset()
    removeItem.mockReset()
  })

  it('uses the approved cart language and a truthful media fallback', () => {
    render(<CartPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Lo que elegiste.' })).toBeInTheDocument()
    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Legging Flujo' })).toHaveAttribute('href', '/catalogo/legging-flujo')
  })

  it('updates real quantities and removes the selected line', async () => {
    const user = userEvent.setup()
    render(<CartPage />)

    await user.click(screen.getByRole('button', { name: 'Aumentar Legging Flujo' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar Legging Flujo' }))

    expect(setQuantity).toHaveBeenNthCalledWith(1, item.key, 2)
    expect(removeItem).toHaveBeenCalledWith(item.key)
  })

  it('exposes quantity as a group and does not decrement below one', () => {
    render(<CartPage />)

    expect(screen.getByRole('group', { name: 'Cantidad de Legging Flujo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reducir Legging Flujo' })).toBeDisabled()
    expect(setQuantity).not.toHaveBeenCalled()
  })

  it('disables quantity increases at live stock capacity', () => {
    cart.items = [{ ...item, quantity: item.maxQuantity }]
    render(<CartPage />)

    expect(screen.getByRole('button', { name: 'Aumentar Legging Flujo' })).toBeDisabled()
  })

  it('offers a calm recovery when the cart is empty', () => {
    cart.items = []
    render(<CartPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Tu selección empieza aquí.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar colección' })).toHaveAttribute('href', '/catalogo')
  })
})
