import type { CommerceProduct } from '@/lib/commerce/types'

export function selectHomeProducts(products: CommerceProduct[], limit = 3): CommerceProduct[] {
  const selectionLimit = Math.min(Math.max(0, limit), 3)
  const selected: CommerceProduct[] = []
  const selectedIds = new Set<string>()

  const append = (product: CommerceProduct) => {
    if (selected.length >= selectionLimit || selectedIds.has(product.id)) return
    selected.push(product)
    selectedIds.add(product.id)
  }

  products.forEach((product) => {
    if (product.featured) append(product)
  })
  products.forEach((product) => {
    if (!product.featured) append(product)
  })

  return selected
}
