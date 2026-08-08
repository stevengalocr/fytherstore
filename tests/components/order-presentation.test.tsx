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
    expect(screen.getByText((content) => content.includes('San José'))).toHaveTextContent(
      new Date(order.tracking[0].createdAt).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' }),
    )
  })

  it.each([
    ['sinpe', 'SINPE Móvil'],
    ['link', 'Link de pago'],
    ['cash', 'Efectivo'],
  ] as const)('maps payment method %s to its customer-facing label', (paymentMethod, label) => {
    render(<OrderPresentation order={{ ...order, paymentMethod }} view="confirmation" />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('falls back to factual raw values for unknown live status and payment data', () => {
    const unexpectedOrder = {
      ...order,
      status: 'awaiting_pickup',
      paymentMethod: 'bank_transfer',
    } as unknown as CommerceOrder

    render(<OrderPresentation order={unexpectedOrder} view="tracking" />)

    expect(screen.getByText('awaiting_pickup')).toBeInTheDocument()
    expect(screen.getByText('bank_transfer')).toBeInTheDocument()
  })

  it('shows an honest empty state when tracking history has not started', () => {
    render(<OrderPresentation order={{ ...order, tracking: [] }} view="tracking" />)

    expect(screen.getByText('Aún no hay eventos de seguimiento.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
