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
  it.each([
    '',
    '   ',
    'correo@',
    '@example.com',
    '.user@example.com',
    'user.@example.com',
    'user..name@example.com',
    'user()@example.com',
    'user@@example.com',
    'user@example..com',
    'user@exam_ple.com',
    'user@exam!ple.com',
    'user@-example.com',
    'user@example-.com',
    'user@example.c',
    'user@example.123',
    `${'a'.repeat(65)}@example.com`,
    `${'a'.repeat(245)}@example.com`,
  ])(
    'rejects malformed or overlong email %j',
    (email) => {
      expect(normalizeCheckoutEmail(email)).toBeNull()
    },
  )

  it.each([
    ['  Steven@Example.COM  ', 'steven@example.com'],
    ['FYTHER+MOVE@Example.co.cr', 'fyther+move@example.co.cr'],
    ["friend.o'hara@example.com", "friend.o'hara@example.com"],
  ])('normalizes the valid email %j', (email, normalized) => {
    expect(normalizeCheckoutEmail(email)).toBe(normalized)
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
