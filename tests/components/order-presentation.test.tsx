import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import OrderPresentation from '@/components/commerce/OrderPresentation'
import type { CommerceOrder } from '@/lib/commerce/types'

const order: CommerceOrder = {
  id: 'order-123',
  orderNumber: 'FY-12345',
  status: 'shipped',
  total: { amount: 28900, currency: 'CRC' },
  createdAt: '2026-08-08T16:00:00.000Z',
  paymentMethod: 'sinpe',
  lines: [{
    id: 'line-1',
    name: 'Legging Flujo',
    image: null,
    quantity: 1,
    unitPrice: { amount: 28900, currency: 'CRC' },
    subtotal: { amount: 28900, currency: 'CRC' },
  }],
  tracking: [{
    id: 'event-1',
    status: 'shipped',
    title: 'Salió para entrega',
    description: 'Va camino a tu dirección.',
    location: 'San José',
    createdAt: '2026-08-08T16:00:00.000Z',
  }],
}

describe('OrderPresentation', () => {
  it('shows the confirmed order number and its real tracking link', () => {
    render(<OrderPresentation order={order} view="confirmation" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Pedido confirmado.' })).toBeInTheDocument()
    expect(screen.getByText('FY-12345')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Seguir pedido' })).toHaveAttribute('href', '/tracking/order-123')
  })

  it('shows the warm tracking heading with mapped status and factual event details', () => {
    render(<OrderPresentation order={order} view="tracking" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Tu pedido sigue su camino.' })).toBeInTheDocument()
    expect(screen.getByText('En camino')).toBeInTheDocument()
    expect(screen.getByText('Salió para entrega')).toBeInTheDocument()
    expect(screen.getByText(/San José/)).toBeInTheDocument()
  })
})
