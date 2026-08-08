import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CheckoutClient from '@/app/checkout/CheckoutClient'

vi.mock('@/app/actions/checkout', () => ({ createOrder: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [{ key: 'p|', productId: 'p', variantId: null, name: 'Motion Tee', variantName: null, image: null, quantity: 1, slug: 'motion-tee', unitPrice: { amount: 1000, currency: 'CRC' }, maxQuantity: 2 }],
    subtotal: { amount: 1000, currency: 'CRC' },
    clear: vi.fn(),
  }),
}))

describe('CheckoutClient', () => {
  it('announces validation errors and keeps entered customer data', async () => {
    const user = userEvent.setup()
    render(<CheckoutClient methods={[{ id: 'sinpe', label: 'SINPE Móvil', description: 'Método configurado' }]} />)
    const name = screen.getByLabelText(/nombre completo/i)
    await user.type(name, 'Steven')
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(name).toHaveValue('Steven')
  })
})
