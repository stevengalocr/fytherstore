import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import EditorialSections from '@/components/site/EditorialSections'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

describe('HeroMedia', () => {
  it('presents the approved warm Spanish hero contract', () => {
    const { container } = render(<HeroMedia />)

    const hero = container.querySelector('.hero-section')
    expect(hero).toHaveAttribute('id', 'descubrir')
    expect(hero).toHaveAttribute('data-scene', 'hero')
    expect(screen.getByRole('heading', { name: 'Muévete a tu manera.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('link', { name: 'Conocer Fyther' })).toHaveAttribute('href', '/#fyther')
    expect(screen.getByRole('img', { name: 'Boutique nocturna de Fyther Store' })).toBeInTheDocument()
    expect(screen.queryByText(/move different/i)).not.toBeInTheDocument()
  })

  it('renders the calm Fyther Current without a repeated marquee', () => {
    const { container } = render(<MotionTrack />)

    const rail = screen.getByRole('region', { name: 'Moverse, sentirse bien, compartir, Fyther' })
    expect(rail).toHaveClass('current-rail')
    expect(rail).toHaveAttribute('data-current')
    expect(rail.querySelector('p')).toHaveTextContent('MOVERSE · SENTIRSE BIEN · COMPARTIR · FYTHER')
    expect(rail.querySelectorAll('p span')).toHaveLength(3)
    expect(container.querySelector('.current-line')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.current-line > span')).toHaveLength(1)
  })

  it('keeps a meaningful current phrase visible below the 96svh hero', () => {
    const currentRailCss = globalsCss.match(/\.current-rail\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(currentRailCss).toContain('justify-content: space-between')
  })

  it('provides the Fyther brand-section anchor', () => {
    const { container } = render(<EditorialSections />)

    expect(container.querySelector('.manifesto-section')).toHaveAttribute('id', 'fyther')
  })
})
