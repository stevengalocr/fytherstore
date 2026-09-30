import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase-server', () => ({
  createServiceClient: () => ({ from: mocks.from }),
  getServerBusinessId: () => 'business-1',
}))

import { readLiveOrder } from '@/lib/commerce/orders-server'

describe('readLiveOrder', () => {
  const orderId = '11111111-1111-4111-8111-111111111111'
  const orderRow = (paymentMethod: string) => ({
    id: orderId,
    order_number: 'FY-1001',
    status: 'pending',
    total: 28900,
    created_at: '2026-08-08T12:00:00.000Z',
    payment_method: paymentMethod,
    items: [],
    tracking: [],
  })

  beforeEach(() => {
    mocks.from.mockReset()
    mocks.select.mockReset()
    mocks.eq.mockReset()
    mocks.order.mockReset()
    mocks.maybeSingle.mockReset()

    const query = {
      select: mocks.select,
      eq: mocks.eq,
      order: mocks.order,
      maybeSingle: mocks.maybeSingle,
    }
    mocks.from.mockReturnValue(query)
    mocks.select.mockReturnValue(query)
    mocks.eq.mockReturnValue(query)
    mocks.order.mockReturnValue(query)
  })

  // Contrato (e): confirmación y seguimiento leen columnas enumeradas y nunca
  // las privadas del negocio (`buyer_*`, `total_cost`, `unit_cost`,
  // `order_tracking.changed_by`). La lista de seguimiento coincide con
  // `COLUMNAS_PUBLICAS_SEGUIMIENTO` del CORE (sin `order_id`/`business_id`,
  // que ya están fijados por el filtro).
  it('reads the order, its lines and its tracking with enumerated public columns only', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: orderRow('cash'), error: null })

    await readLiveOrder(orderId)

    const [columns] = mocks.select.mock.calls[0] as [string]
    const normalized = columns.replace(/\s+/g, '')
    expect(normalized).not.toContain('*')
    expect(normalized).not.toMatch(/buyer_|cost|changed_by/)
    expect(normalized).toContain('items:order_items(id,product_name,product_image,quantity,unit_price,subtotal)')
    expect(normalized).toContain('tracking:order_tracking(id,status,title,description,location,created_at)')
    expect(mocks.eq).toHaveBeenCalledWith('id', orderId)
    expect(mocks.eq).toHaveBeenCalledWith('business_id', 'business-1')
  })

  it('returns null when the order does not exist', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(readLiveOrder(orderId)).resolves.toBeNull()
  })

  it('throws when the live order query fails', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: 'database unavailable' } })

    await expect(readLiveOrder(orderId)).rejects.toThrow('No pudimos consultar este pedido.')
  })

  it('maps the BilBildin card value back to the UI link method', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: orderRow('card'), error: null })

    await expect(readLiveOrder(orderId)).resolves.toMatchObject({ paymentMethod: 'link' })
  })

  it.each(['sinpe', 'link', 'cash'] as const)('keeps the valid %s payment method', async (paymentMethod) => {
    mocks.maybeSingle.mockResolvedValue({ data: orderRow(paymentMethod), error: null })

    await expect(readLiveOrder(orderId)).resolves.toMatchObject({ paymentMethod })
  })

  it('rejects an unknown live payment method', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: orderRow('crypto'), error: null })

    await expect(readLiveOrder(orderId)).rejects.toThrow('El método de pago del pedido no es válido.')
  })
})
