import { describe, expect, it } from 'vitest'
import { validateLiveCheckoutConfig } from '@/lib/commerce/checkout'

describe('live checkout configuration', () => {
  it('rejects checkout when the business id is absent', () => {
    expect(() => validateLiveCheckoutConfig({})).toThrow(/configuración/i)
  })

  it('returns server credentials only when every value exists', () => {
    expect(validateLiveCheckoutConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_BUSINESS_ID: '11111111-1111-4111-8111-111111111111',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    })).toEqual({
      url: 'https://example.supabase.co',
      businessId: '11111111-1111-4111-8111-111111111111',
      serviceRoleKey: 'service-key',
    })
  })
})
