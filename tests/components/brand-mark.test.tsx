import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandMark from '@/components/BrandMark'

describe('BrandMark', () => {
  it('renders the official primary logo without recreated brand text', () => {
    const { container } = render(<BrandMark />)
    const image = screen.getByRole('img', { name: 'Fyther Store' })

    expect(decodeURIComponent(image.getAttribute('src') ?? '')).toContain('/brand/fyther-mark-header.webp')
    expect(image).toHaveAttribute('width', '640')
    expect(image).toHaveAttribute('height', '640')
    expect(container.querySelector('.brand-mark')?.textContent).toBe('')
  })

  it('renders the alternate official logo', () => {
    render(<BrandMark variant="alternate" />)
    const image = screen.getByRole('img', { name: 'Fyther Store' })

    expect(decodeURIComponent(image.getAttribute('src') ?? '')).toContain('/brand/fyther-mark-footer.webp')
    expect(image).toHaveAttribute('width', '960')
    expect(image).toHaveAttribute('height', '960')
  })

  it('renders with empty alt text when decorative', () => {
    const { container } = render(<BrandMark decorative />)

    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('forwards custom responsive source sizes to the official image', () => {
    render(<BrandMark sizes="(max-width: 767px) 220px, 280px" />)

    expect(screen.getByRole('img', { name: 'Fyther Store' })).toHaveAttribute(
      'sizes',
      '(max-width: 767px) 220px, 280px',
    )
  })
})
