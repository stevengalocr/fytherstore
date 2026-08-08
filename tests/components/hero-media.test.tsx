import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'
import EditorialSections from '@/components/site/EditorialSections'

describe('HeroMedia', () => {
  it('keeps the offer and primary action available without video playback', () => {
    const { container } = render(<HeroMedia />)
    expect(container.querySelector('.hero-section')).toHaveAttribute('id', 'descubrir')
    expect(screen.getByRole('heading', { name: /move different/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shop the drop/i })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('img', { name: /fyther store/i })).toBeInTheDocument()
  })

  it('provides the Fyther brand-section anchor', () => {
    const { container } = render(<EditorialSections />)

    expect(container.querySelector('.manifesto-section')).toHaveAttribute('id', 'fyther')
  })
})
