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
    const { container } = render(<OrderPresentation order={order} view="confirmation" />)

    expect(container.querySelector('.status-surface')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Pedido confirmado.' })).toBeInTheDocument()
    expect(screen.getByText('FY-12345')).toBeInTheDocument()
    expect(screen.getByText(/Legging Flujo/)).toBeInTheDocument()
    expect(screen.getByText('SINPE Móvil')).toBeInTheDocument()
    const trackingLink = screen.getByRole('link', { name: 'Seguir pedido' })
    expect(trackingLink).toHaveClass('status-primary-action')
    expect(trackingLink).toHaveAttribute('href', '/tracking/order-123')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
  })

  it('shows the warm tracking heading with mapped status and factual event details', () => {
    const { container } = render(<OrderPresentation order={order} view="tracking" />)

    expect(container.querySelector('.status-surface')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Tu pedido sigue su camino.' })).toBeInTheDocument()
    expect(screen.getByText('Pedido FY-12345')).toBeInTheDocument()
    expect(screen.getByText('En camino')).toBeInTheDocument()
    expect(screen.getByText('Salió para entrega')).toBeInTheDocument()
    expect(screen.getByText('Va camino a tu dirección.')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('San José'))).toHaveTextContent(
      new Date(order.tracking[0].createdAt).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' }),
    )
    const collectionLink = screen.getByRole('link', { name: 'Volver a la colección' })
    expect(collectionLink).toHaveClass('status-primary-action')
    expect(collectionLink).toHaveAttribute('href', '/catalogo')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
  })

  it.each(['confirmation', 'tracking'] as const)('keeps the %s surface free of internal and prohibited copy', (view) => {
    const { container } = render(<OrderPresentation order={order} view={view} />)

    expect(container).not.toHaveTextContent(/bilbildin|supabase|endpoint|environment|entorno|configuraci[oó]n|service.role|stack|digest|demo|simulaci[oó]n|cambios|devoluciones/i)
  })

  it.each([
    ['sinpe', 'SINPE Móvil'],
    ['link', 'Link de pago'],
    ['cash', 'Efectivo'],
  ] as const)('maps payment method %s to its customer-facing label', (paymentMethod, label) => {
    render(<OrderPresentation order={{ ...order, paymentMethod }} view="confirmation" />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each([
    ['pending', 'Pedido recibido'],
    ['preparing', 'En preparación'],
    ['shipped', 'En camino'],
    ['delivered', 'Entregado'],
    ['cancelled', 'Cancelado'],
  ] as const)('maps known order status %s to %s', (status, label) => {
    render(<OrderPresentation order={{ ...order, status }} view="tracking" />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each([
    ['unknown', 'awaiting_pickup'],
    ['empty', ''],
    ['unusual', 'STATUS::<script>'],
  ] as const)('uses a neutral customer label for %s backend status values', (_case, status) => {
    const unexpectedOrder = {
      ...order,
      status,
    } as unknown as CommerceOrder

    render(<OrderPresentation order={unexpectedOrder} view="tracking" />)

    expect(screen.getByText('En proceso')).toBeInTheDocument()
    if (status) expect(screen.queryByText(status, { exact: true })).not.toBeInTheDocument()
  })

  it('preserves the factual fallback for an unknown payment method', () => {
    const unexpectedOrder = {
      ...order,
      paymentMethod: 'bank_transfer',
    } as unknown as CommerceOrder

    render(<OrderPresentation order={unexpectedOrder} view="tracking" />)

    expect(screen.getByText('En camino')).toBeInTheDocument()
    expect(screen.getByText('bank_transfer')).toBeInTheDocument()
  })

  it('shows an honest empty state when tracking history has not started', () => {
    render(<OrderPresentation order={{ ...order, tracking: [] }} view="tracking" />)

    expect(screen.getByText('Aún no hay eventos de seguimiento.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
