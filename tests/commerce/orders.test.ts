import { describe, expect, it } from 'vitest'
import { buildOrderFilters } from '@/lib/commerce/orders'

describe('order isolation', () => {
  it('requires both order and business identifiers', () => {
    expect(buildOrderFilters('order-1', 'business-1')).toEqual({ id: 'order-1', business_id: 'business-1' })
  })
})
