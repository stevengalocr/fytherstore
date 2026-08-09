import { describe, expect, it } from 'vitest'
import { mapBilBildinProduct } from '@/lib/commerce/mappers'

const row = {
  id: 'product-1',
  name: 'Motion Tee',
  slug: 'motion-tee',
  short_description: 'Short',
  description: 'Long',
  price: 18900,
  compare_at_price: null,
  images: [],
  category: 'Ropa',
  tags: ['training'],
  attributes: {},
  featured: true,
  stock_quantity: 0,
  variants: [],
  cost_price: 9500,
}

describe('BilBildin product mapping', () => {
  it('maps zero stock to out of stock', () => {
    expect(mapBilBildinProduct(row).availability).toBe('out_of_stock')
  })

  it('does not expose cost fields', () => {
    expect(mapBilBildinProduct(row)).not.toHaveProperty('cost_price')
  })

  it('adds the price modifier to a variant price', () => {
    const product = mapBilBildinProduct({
      ...row,
      stock_quantity: 2,
      variants: [{
        id: 'variant-1', product_id: 'product-1', name: 'Talla M', sku: null,
        price_modifier: 1500, stock_quantity: 1, attributes: { size: 'M' }, images: [],
      }],
    })
    expect(product.variants[0].price.amount).toBe(20400)
  })

  it('derives availability from variants when the product has variants', () => {
    const product = mapBilBildinProduct({
      ...row,
      stock_quantity: 0,
      variants: [{
        id: 'variant-1', product_id: 'product-1', name: 'Talla M', sku: null,
        price_modifier: 0, stock_quantity: 3, attributes: { size: 'M' }, images: [],
      }],
    })

    expect(product.availability).toBe('in_stock')
    expect(product.stockQuantity).toBe(3)
  })
})
