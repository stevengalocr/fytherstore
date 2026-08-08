import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'

describe('HeroMedia', () => {
  it('keeps the offer and primary action available without video playback', () => {
    render(<HeroMedia />)
    expect(screen.getByRole('heading', { name: /move different/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shop the drop/i })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('img', { name: /fyther store/i })).toBeInTheDocument()
  })
})
