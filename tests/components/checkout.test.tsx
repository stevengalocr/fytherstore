import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrder } from '@/app/actions/checkout'
import CheckoutClient from '@/app/checkout/CheckoutClient'
import type { CartLine } from '@/lib/commerce/types'

const { cart, clear, push } = vi.hoisted(() => ({
  cart: {
    items: [] as CartLine[],
    subtotal: { amount: 1000, currency: 'CRC' as const },
  },
  clear: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/app/actions/checkout', () => ({ createOrder: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ ...cart, clear }),
}))

const methods = [{ id: 'sinpe' as const, label: 'SINPE Móvil', description: 'Método configurado' }]
const item: CartLine = {
  key: 'p|',
  productId: 'p',
  variantId: null,
  name: 'Motion Tee',
  variantName: null,
  image: null,
  quantity: 1,
  slug: 'motion-tee',
  unitPrice: { amount: 1000, currency: 'CRC' },
  maxQuantity: 2,
}

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Nombre completo' }), 'Steven')
  await user.type(screen.getByRole('textbox', { name: 'Correo electrónico' }), 'steven@example.com')
  await user.type(screen.getByRole('textbox', { name: 'Dirección exacta' }), 'San José, Costa Rica')
}

describe('CheckoutClient', () => {
  beforeEach(() => {
    cart.items = [item]
    clear.mockReset()
    push.mockReset()
    vi.mocked(createOrder).mockReset()
  })

  it('uses the approved calm checkout language', () => {
    render(<CheckoutClient methods={methods} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Terminemos juntas.' })).toBeInTheDocument()
  })

  it('marks missing fields, focuses the first one, and preserves entered data', async () => {
    const user = userEvent.setup()
    render(<CheckoutClient methods={methods} />)
    const name = screen.getByRole('textbox', { name: 'Nombre completo' })
    const email = screen.getByRole('textbox', { name: 'Correo electrónico' })
    const address = screen.getByRole('textbox', { name: 'Dirección exacta' })

    await user.type(name, 'Steven')
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados para continuar.')
    expect(name).toHaveValue('Steven')
    expect(name).toHaveAttribute('aria-invalid', 'false')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(address).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Ingresa tu correo electrónico.')
    expect(address).toHaveAccessibleDescription('Ingresa tu dirección exacta.')
    expect(email).toHaveFocus()
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('clears corrected field errors without clearing other customer data', async () => {
    const user = userEvent.setup()
    render(<CheckoutClient methods={methods} />)
    const name = screen.getByRole('textbox', { name: 'Nombre completo' })
    const email = screen.getByRole('textbox', { name: 'Correo electrónico' })
    const address = screen.getByRole('textbox', { name: 'Dirección exacta' })

    await user.type(name, 'Steven')
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    await user.type(email, 'steven@example.com')

    expect(email).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText('Ingresa tu correo electrónico.')).not.toBeInTheDocument()
    expect(name).toHaveValue('Steven')
    expect(address).toHaveAttribute('aria-invalid', 'true')

    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(address).toHaveFocus()
    expect(name).toHaveValue('Steven')
    expect(email).toHaveValue('steven@example.com')
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('rejects malformed email and submits the normalized value', async () => {
    const user = userEvent.setup()
    vi.mocked(createOrder).mockResolvedValue({ ok: false, mode: 'live', error: 'Detener aquí.' })
    render(<CheckoutClient methods={methods} />)

    const email = screen.getByRole('textbox', { name: 'Correo electrónico' })
    await user.type(screen.getByRole('textbox', { name: 'Nombre completo' }), 'Steven')
    await user.type(email, 'correo@')
    await user.type(screen.getByRole('textbox', { name: 'Dirección exacta' }), 'San José')
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(email).toHaveAccessibleDescription('Ingresa un correo electrónico válido.')
    expect(createOrder).not.toHaveBeenCalled()

    await user.clear(email)
    await user.type(email, '  Steven@Example.COM  ')
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
      customer: expect.objectContaining({ email: 'steven@example.com' }),
    }))
  })

  it('rejects a malformed dot-atom email through the shared validator', async () => {
    const user = userEvent.setup()
    render(<CheckoutClient methods={methods} />)

    await user.type(screen.getByRole('textbox', { name: 'Nombre completo' }), 'Steven')
    const email = screen.getByRole('textbox', { name: 'Correo electrónico' })
    await user.type(email, 'user..name@example.com')
    await user.type(screen.getByRole('textbox', { name: 'Dirección exacta' }), 'San José')
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(email).toHaveAccessibleDescription('Ingresa un correo electrónico válido.')
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('keeps customer data and announces a server failure', async () => {
    const user = userEvent.setup()
    vi.mocked(createOrder).mockResolvedValue({ ok: false, mode: 'live', error: 'No pudimos validar el inventario.' })
    render(<CheckoutClient methods={methods} />)

    await completeRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos validar el inventario.')
    expect(screen.getByRole('textbox', { name: 'Nombre completo' })).toHaveValue('Steven')
    expect(clear).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('recovers from a rejected order request without clearing the form', async () => {
    const user = userEvent.setup()
    vi.mocked(createOrder).mockRejectedValue(new Error('network details'))
    render(<CheckoutClient methods={methods} />)

    await completeRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar para confirmar tu pedido. Intenta de nuevo.')
    expect(screen.getByRole('textbox', { name: 'Nombre completo' })).toHaveValue('Steven')
    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeEnabled()
    expect(clear).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('keeps the live order payload, cart clear, and confirmation redirect unchanged', async () => {
    const user = userEvent.setup()
    vi.mocked(createOrder).mockResolvedValue({ ok: true, mode: 'live', orderId: 'order-123' })
    render(<CheckoutClient methods={methods} />)

    await completeRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/confirmacion/order-123'))
    expect(createOrder).toHaveBeenCalledWith({
      items: [{
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        variantName: item.variantName,
        image: item.image,
        quantity: item.quantity,
      }],
      customer: { name: 'Steven', email: 'steven@example.com', phone: '' },
      address: { address: 'San José, Costa Rica', city: '', country: 'Costa Rica', notes: '' },
      paymentMethod: 'sinpe',
    })
    expect(clear).toHaveBeenCalledOnce()
  })

  it('prevents reentrant submit events before React can render the pending state', async () => {
    const user = userEvent.setup()
    let resolveOrder!: (value: { ok: false; mode: 'live'; error: string }) => void
    vi.mocked(createOrder).mockImplementation(() => new Promise((resolve) => { resolveOrder = resolve }))
    render(<CheckoutClient methods={methods} />)

    await completeRequiredFields(user)
    const form = screen.getByRole('button', { name: /confirmar pedido/i }).closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(screen.getByRole('button', { name: 'Confirmando tu pedido' })).toBeDisabled()
    expect(createOrder).toHaveBeenCalledTimes(1)

    resolveOrder({ ok: false, mode: 'live', error: 'Intenta de nuevo.' })
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeEnabled())
  })

  it('synchronizes payment selection when live methods change', async () => {
    const user = userEvent.setup()
    vi.mocked(createOrder).mockResolvedValue({ ok: false, mode: 'live', error: 'Detener aquí.' })
    const { rerender } = render(<CheckoutClient methods={methods} />)

    rerender(<CheckoutClient methods={[{ id: 'cash', label: 'Efectivo', description: 'Al recibir' }]} />)
    expect(screen.getByRole('radio', { name: /efectivo/i })).toBeChecked()

    await completeRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /confirmar pedido/i }))
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'cash' }))
  })

  it('keeps the empty-cart recovery truthful', () => {
    cart.items = []
    render(<CheckoutClient methods={methods} />)

    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar pedido/i })).not.toBeInTheDocument()
  })

  it('shows live payment configuration descriptions and blocks checkout without methods', () => {
    const { rerender } = render(<CheckoutClient methods={methods} />)

    expect(screen.getByText('Método configurado')).toBeInTheDocument()

    rerender(<CheckoutClient methods={[]} />)
    expect(screen.getByText('No hay métodos de pago configurados. Contacta a Fyther antes de continuar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeDisabled()
  })
})
