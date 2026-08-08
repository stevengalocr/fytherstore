import { bilBildinCommerce } from '@/lib/commerce/bilbildin'
import { commerceMode } from '@/lib/commerce/config'
import { demoCommerce } from '@/lib/commerce/demo'

export const commerce = commerceMode === 'live' ? bilBildinCommerce : demoCommerce
export { commerceMode }
export type * from '@/lib/commerce/types'
