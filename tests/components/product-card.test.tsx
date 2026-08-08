import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProductCard from '@/components/ProductCard'
import type { CommerceProduct } from '@/lib/commerce/types'

const product: CommerceProduct = {
  id: 'product-1', slug: 'motion-tee', name: 'Motion Tee', shortDescription: 'Technical tee',
  description: null, price: { amount: 18900, currency: 'CRC' }, compareAtPrice: null,
  images: [], availability: 'out_of_stock', stockQuantity: 0, variants: [], category: 'Ropa',
  tags: [], featured: false,
}

describe('ProductCard', () => {
  it('keeps live product details and navigation visible when available', () => {
    render(<ProductCard product={{
      ...product,
      slug: 'legging-flujo',
      name: 'Legging Flujo',
      category: 'Leggings',
      price: { amount: 28900, currency: 'CRC' },
      availability: 'in_stock',
      stockQuantity: 4,
    }} />)

    expect(screen.getByText('Leggings')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Legging Flujo' })).toBeInTheDocument()
    expect(screen.getByText(/28[.,\s]900/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver producto Legging Flujo' })).toHaveAttribute('href', '/catalogo/legging-flujo')
  })

  it('disables purchase navigation for an out-of-stock product', () => {
    render(<ProductCard product={product} />)
    expect(screen.getByRole('button', { name: /agotado/i })).toBeDisabled()
    expect(screen.queryByRole('link', { name: /ver producto/i })).not.toBeInTheDocument()
  })

  it('uses a meaningful fallback when no image exists', () => {
    render(<ProductCard product={product} />)
    expect(screen.getByText(/imagen no disponible/i)).toBeInTheDocument()
    expect(screen.getByText('Motion Tee')).toBeInTheDocument()
  })
})
