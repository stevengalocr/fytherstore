import { bilBildinCommerce } from '@/lib/commerce/bilbildin'
import { commerceMode } from '@/lib/commerce/config'

const unconfiguredCommerce = {
  async getProducts() { return [] },
  async getProductBySlug() { return null },
}

export const commerce = commerceMode === 'live' ? bilBildinCommerce : unconfiguredCommerce
export { commerceMode }
export type * from '@/lib/commerce/types'
