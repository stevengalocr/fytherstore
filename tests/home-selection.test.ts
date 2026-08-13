import { describe, expect, it } from 'vitest'
import {
  normalizeCollectionCategory,
  selectAccessoryTags,
  selectHomeProducts,
  splitProductsByWorld,
} from '@/lib/home-selection'
import type { CommerceProduct } from '@/lib/commerce/types'

function product(id: string, featured = false, category: string | null = null): CommerceProduct {
  return {
    id,
    slug: id,
    name: id,
    shortDescription: null,
    description: null,
    price: { amount: 10000, currency: 'CRC' },
    compareAtPrice: null,
    images: [],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category,
    tags: [],
    featured,
  }
}

describe('selectHomeProducts', () => {
  it('uses the first live products when none are featured', () => {
    const products = [product('one'), product('two'), product('three'), product('four')]

    expect(selectHomeProducts(products).map(({ id }) => id)).toEqual(['one', 'two', 'three'])
  })

  it('places one featured product first and fills from non-featured products', () => {
    const products = [product('one'), product('featured', true), product('two'), product('three')]

    expect(selectHomeProducts(products).map(({ id }) => id)).toEqual(['featured', 'one', 'two'])
  })

  it('caps three or more featured products at the limit in original order', () => {
    const products = [product('one', true), product('two', true), product('three', true), product('four', true)]

    expect(selectHomeProducts(products).map(({ id }) => id)).toEqual(['one', 'two', 'three'])
  })

  it('preserves group order across mixed products and never duplicates an id', () => {
    const featured = product('featured', true)
    const products = [product('one'), featured, product('two'), featured, product('second-featured', true)]

    expect(selectHomeProducts(products).map(({ id }) => id)).toEqual(['featured', 'second-featured', 'one'])
  })
})

describe('normalizeCollectionCategory', () => {
  it('normalizes spacing, casing, and diacritics', () => {
    expect(normalizeCollectionCategory('  Accesórios ')).toBe('accesorios')
    expect(normalizeCollectionCategory('ROPA')).toBe('ropa')
    expect(normalizeCollectionCategory(null)).toBe('')
  })
})

describe('splitProductsByWorld', () => {
  it('returns exact normalized Ropa and Accesorios buckets in product order', () => {
    const shirt = product('shirt', false, 'Ropa')
    const cap = product('cap', false, 'Accesorios')
    const shorts = product('shorts', false, 'ropa')
    const bag = product('bag', false, 'ACCESORIOS')
    const products = [
      shirt,
      product('shoes', false, 'Running'),
      cap,
      shorts,
      bag,
    ]

    expect(splitProductsByWorld(products)).toEqual({
      ropa: [shirt, shorts],
      accesorios: [cap, bag],
    })
  })
})

describe('selectAccessoryTags', () => {
  it('trims and deduplicates tags while preserving first-seen order and capping the result at five', () => {
    const first = product('first')
    first.tags = ['  Gorras  ', 'Bolsos', 'gorras', ' Medias ']
    const second = product('second')
    second.tags = ['BOLSOS', 'Botellas', ' Llaveros ', 'Mu\u00f1equeras']

    expect(selectAccessoryTags([first, second])).toEqual([
      'Gorras',
      'Bolsos',
      'Medias',
      'Botellas',
      'Llaveros',
    ])
  })

  it('returns an empty list for zero or one distinct non-empty tags', () => {
    const empty = product('empty')
    empty.tags = ['', '   ']
    const repeated = product('repeated')
    repeated.tags = [' Gorras ', 'GORRAS']

    expect(selectAccessoryTags([])).toEqual([])
    expect(selectAccessoryTags([empty])).toEqual([])
    expect(selectAccessoryTags([empty, repeated])).toEqual([])
  })

  it('returns the first tag for a limit of one when at least two distinct tags are available', () => {
    const accessories = product('accessories')
    accessories.tags = ['Gorras', 'Bolsos']

    expect(selectAccessoryTags([accessories], 1)).toEqual(['Gorras'])
  })

  it('returns an empty list for a limit of zero', () => {
    const accessories = product('accessories')
    accessories.tags = ['Gorras', 'Bolsos']

    expect(selectAccessoryTags([accessories], 0)).toEqual([])
  })
})
