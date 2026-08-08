import type { Availability, CommerceImage, CommerceProduct, CommerceVariant } from '@/lib/commerce/types'

interface BilBildinVariantRow {
  id: string
  product_id: string
  name: string
  sku: string | null
  price_modifier: number | null
  stock_quantity: number
  attributes: Record<string, unknown> | null
  images: string[] | null
}

export interface BilBildinProductRow {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  images: string[] | null
  category: string | null
  tags: string[] | null
  attributes: Record<string, unknown> | null
  featured: boolean
  stock_quantity: number
  variants?: BilBildinVariantRow[] | null
  [key: string]: unknown
}

function mapImages(images: string[] | null | undefined, name: string): CommerceImage[] {
  return (images ?? []).filter(Boolean).map((src) => ({ src, alt: name }))
}

function availability(stock: number): Availability {
  return stock > 0 ? 'in_stock' : 'out_of_stock'
}

export function mapBilBildinProduct(row: BilBildinProductRow): CommerceProduct {
  const basePrice = Number(row.price) || 0
  const variants: CommerceVariant[] = (row.variants ?? []).map((variant) => ({
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: { amount: basePrice + (Number(variant.price_modifier) || 0), currency: 'CRC' },
    stockQuantity: Number(variant.stock_quantity) || 0,
    attributes: variant.attributes ?? {},
    images: mapImages(variant.images, `${row.name}, ${variant.name}`),
  }))

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    price: { amount: basePrice, currency: 'CRC' },
    compareAtPrice: row.compare_at_price && row.compare_at_price > basePrice
      ? { amount: row.compare_at_price, currency: 'CRC' }
      : null,
    images: mapImages(row.images, row.name),
    availability: availability(Number(row.stock_quantity) || 0),
    stockQuantity: Number(row.stock_quantity) || 0,
    variants,
    category: row.category,
    tags: row.tags ?? [],
    featured: Boolean(row.featured),
    demo: false,
  }
}
