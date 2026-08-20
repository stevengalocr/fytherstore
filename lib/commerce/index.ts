import 'server-only'
import { bilBildinCommerce } from '@/lib/commerce/bilbildin'
import { commerceMode as configuredCommerceMode } from '@/lib/commerce/config'
import { getE2ECommerceFixtureProvider } from '@/lib/commerce/e2e-fixture'
import type { CommerceMode, CommerceProduct } from '@/lib/commerce/types'

interface CommerceAdapter {
  getProducts(): Promise<CommerceProduct[]>
  getProductBySlug(slug: string): Promise<CommerceProduct | null>
}

const unconfiguredCommerce: CommerceAdapter = {
  async getProducts() { return [] },
  async getProductBySlug() { return null },
}

const fixtureProvider = getE2ECommerceFixtureProvider()

export const commerceMode: CommerceMode = fixtureProvider ? 'live' : configuredCommerceMode
export const commerce: CommerceAdapter = fixtureProvider
  ? fixtureProvider.commerce
  : configuredCommerceMode === 'live'
    ? bilBildinCommerce
    : unconfiguredCommerce
export type * from '@/lib/commerce/types'
