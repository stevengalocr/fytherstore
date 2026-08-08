import { describe, expect, it } from 'vitest'
import {
  getEnabledPaymentMethods,
  normalizeCheckoutEmail,
  validateLiveCheckoutConfig,
} from '@/lib/commerce/checkout'

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

describe('checkout email validation', () => {
  it.each(['', '   ', 'correo@', '@example.com', `${'a'.repeat(245)}@example.com`])(
    'rejects malformed or overlong email %j',
    (email) => {
      expect(normalizeCheckoutEmail(email)).toBeNull()
    },
  )

  it('trims and lowercases a valid email', () => {
    expect(normalizeCheckoutEmail('  Steven@Example.COM  ')).toBe('steven@example.com')
  })
})

describe('live payment method validation', () => {
  it('derives only methods backed by live theme configuration', () => {
    expect(getEnabledPaymentMethods({ sinpe_number: '8888-8888', link_url: 'https://pay.example.com' }))
      .toEqual(['sinpe', 'link'])
    expect(getEnabledPaymentMethods({ cash_instructions: 'Pagar al recibir' })).toEqual(['cash'])
    expect(getEnabledPaymentMethods({})).toEqual([])
  })

  it('ignores blank configuration values', () => {
    expect(getEnabledPaymentMethods({ sinpe_number: ' ', link_url: '', cash_instructions: '  ' })).toEqual([])
  })
})
