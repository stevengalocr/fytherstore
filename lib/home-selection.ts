import type { CommerceProduct } from '@/lib/commerce/types'

export type CollectionWorld = 'ropa' | 'accesorios'

export function normalizeCollectionCategory(category: string | null | undefined): string {
  return (category ?? '').trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function splitProductsByWorld(products: CommerceProduct[]): Record<CollectionWorld, CommerceProduct[]> {
  return products.reduce<Record<CollectionWorld, CommerceProduct[]>>(
    (worlds, product) => {
      const category = normalizeCollectionCategory(product.category)
      if (category === 'ropa' || category === 'accesorios') worlds[category].push(product)
      return worlds
    },
    { ropa: [], accesorios: [] },
  )
}

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

export function selectAccessoryTags(products: CommerceProduct[], limit = 5): string[] {
  const boundedLimit = Math.max(0, limit)
  const tags: string[] = []
  const normalizedTags = new Set<string>()

  for (const product of products) {
    for (const rawTag of product.tags) {
      const tag = rawTag.trim()
      const normalized = tag.toLocaleLowerCase('es')
      if (!tag || normalizedTags.has(normalized)) continue
      normalizedTags.add(normalized)
      tags.push(tag)
    }
  }

  return tags.length >= 2 ? tags.slice(0, boundedLimit) : []
}
