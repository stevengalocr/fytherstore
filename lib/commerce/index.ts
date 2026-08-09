import 'server-only'
import { bilBildinCommerce } from '@/lib/commerce/bilbildin'
import { commerceMode as configuredCommerceMode } from '@/lib/commerce/config'
import { e2eFixtureCommerce } from '@/lib/commerce/e2e-fixture'
import type { CommerceMode, CommerceProduct } from '@/lib/commerce/types'

interface CommerceAdapter {
  getProducts(): Promise<CommerceProduct[]>
  getProductBySlug(slug: string): Promise<CommerceProduct | null>
}

const unconfiguredCommerce: CommerceAdapter = {
  async getProducts() { return [] },
  async getProductBySlug() { return null },
}

const fixtureEnabled = process.env.FYTHER_E2E_COMMERCE_FIXTURE === 'live'

export const commerceMode: CommerceMode = fixtureEnabled ? 'live' : configuredCommerceMode
export const commerce: CommerceAdapter = fixtureEnabled
  ? e2eFixtureCommerce
  : configuredCommerceMode === 'live'
    ? bilBildinCommerce
    : unconfiguredCommerce
export type * from '@/lib/commerce/types'
