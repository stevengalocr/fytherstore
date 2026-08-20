import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ProductCard from '@/components/ProductCard'
import type { CommerceProduct } from '@/lib/commerce/types'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

const product: CommerceProduct = {
  id: 'product-1', slug: 'motion-tee', name: 'Motion Tee', brand: null, shortDescription: 'Technical tee',
  description: null, price: { amount: 18900, currency: 'CRC' }, compareAtPrice: null,
  images: [], availability: 'out_of_stock', stockQuantity: 0, variants: [], category: 'Ropa',
  tags: [], featured: false,
}

describe('ProductCard', () => {
  it('uses one full-card link for product details and a noninteractive action', () => {
    const { container } = render(<ProductCard product={{
      ...product,
      slug: 'legging-flujo',
      name: 'Legging Flujo',
      brand: 'Nike',
      category: 'Leggings',
      price: { amount: 25000, currency: 'CRC' },
      compareAtPrice: { amount: 30000, currency: 'CRC' },
      availability: 'in_stock',
      stockQuantity: 4,
    }} />)

    const card = screen.getByRole('link', { name: 'Ver producto Legging Flujo' })
    expect(container.firstElementChild).toBe(card)
    expect(card).toHaveClass('product-card')
    expect(card).toHaveAttribute('href', '/catalogo/legging-flujo')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(card.querySelectorAll('a, button, input, select, textarea')).toHaveLength(0)
    expect(card.querySelector('.product-action')).toHaveTextContent('Ver producto')
    expect(card.querySelector('.product-action')?.tagName).toBe('SPAN')
    expect(screen.getByText('Nike')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Legging Flujo' })).toBeInTheDocument()
    expect(screen.getByText('₡25 000')).toHaveClass('product-price')
    expect(screen.getByText('₡30 000')).toHaveClass('product-compare-price')
    expect(screen.getByText('₡30 000').tagName).toBe('DEL')
  })

  it('applies image sizing supplied by its layout context', () => {
    render(<ProductCard
      product={{ ...product, images: [{ src: '/producto.jpg', alt: 'Motion Tee en color negro' }] }}
      imageSizes="(max-width: 767px) calc(100vw - 32px), 500px"
    />)

    expect(screen.getByRole('img', { name: 'Motion Tee en color negro' })).toHaveAttribute(
      'sizes',
      '(max-width: 767px) calc(100vw - 32px), 500px',
    )
  })

  it('keeps sold-out products navigable with a noninteractive status', () => {
    const { container } = render(<ProductCard product={product} />)

    expect(screen.getByRole('link', { name: 'Motion Tee, Agotado' })).toHaveAttribute(
      'href',
      '/catalogo/motion-tee',
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('.product-action-disabled')).toHaveTextContent('Agotado')
    expect(container.querySelector('.product-action-disabled')?.tagName).toBe('SPAN')
  })

  it('falls back to category without inferring a brand from the product name', () => {
    const { container } = render(<ProductCard product={{ ...product, name: 'Nike Motion Tee', category: 'Ropa' }} />)

    expect(screen.getByText('Ropa')).toHaveClass('product-category')
    expect(screen.queryByText('Nike')).not.toBeInTheDocument()
    expect(container.querySelector('.product-compare-price')).not.toBeInTheDocument()
  })

  it('uses a meaningful fallback when no image exists', () => {
    render(<ProductCard product={product} />)
    expect(screen.getByText(/imagen no disponible/i)).toBeInTheDocument()
    expect(screen.getByText('Motion Tee')).toBeInTheDocument()
  })

  it('gives keyboard focus the same stable feedback as hover', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={{ ...product, availability: 'in_stock' }} />)

    const card = screen.getByRole('link', { name: 'Ver producto Motion Tee' })
    await user.tab()
    expect(card).toHaveFocus()

    expect(globalsCss).toMatch(/\.product-media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5;[^}]*border-radius:\s*var\(--radius-product\)/)
    expect(globalsCss).toMatch(/\.product-card:focus-visible\s*\{[^}]*border-color:\s*var\(--collection-accent,\s*var\(--color-cyan\)\)[^}]*outline:\s*2px solid var\(--collection-accent,\s*var\(--color-cyan\)\)/)
    expect(globalsCss).toMatch(/\.product-card:focus-visible \.product-image\s*\{[^}]*transform:\s*scale\(1\.025\)/)
    expect(globalsCss).toMatch(/\.product-card:focus-visible \.product-action\s*\{[^}]*transform:\s*translateX\(0\.3rem\)[^}]*color:\s*var\(--color-cyan\)/)
    expect(globalsCss).toMatch(/\.product-card:hover \.product-image\s*\{[^}]*transform:\s*scale\(1\.025\)/)
    expect(globalsCss).not.toMatch(/\.product-card:focus-within/)
  })

  it('stacks mobile product copy so 200% text keeps the full card width', () => {
    const mobileCss = globalsCss.match(/@media \(max-width: 560px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(mobileCss).toMatch(/\.product-copy\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(mobileCss).toMatch(/\.product-prices\s*\{[^}]*align-items:\s*flex-start/)
  })
})
