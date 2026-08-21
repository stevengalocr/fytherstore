import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import EditorialStory from '@/components/site/EditorialStory'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

describe('HeroMedia', () => {
  it('renders a single static, art-directed hero without video or scroll controls', () => {
    const { container } = render(<HeroMedia />)
    const journey = container.querySelector('.hero-journey')
    const picture = container.querySelector('.hero-still-frame')

    expect(journey).toHaveAttribute('id', 'descubrir')
    expect(journey).toHaveAttribute('data-scene', 'hero')
    expect(journey).toHaveAttribute('data-hero-static', 'true')
    expect(journey).toHaveClass('hero-journey-static')
    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-category-cue')).not.toBeInTheDocument()
    expect(picture?.querySelector('source')).toHaveAttribute(
      'srcset',
      '/editorial/hero-open-suitcase-branded-mobile.webp',
    )
    expect(decodeURIComponent(picture?.querySelector('img')?.getAttribute('src') ?? '')).toContain(
      '/editorial/hero-open-suitcase-branded.webp',
    )
    expect(screen.getByRole('img', { name: /maletín fyther abierto/i })).toBeInTheDocument()
  })

  it('keeps the primary actions first in the keyboard path', async () => {
    render(<HeroMedia />)
    const user = userEvent.setup()
    const clothing = screen.getByRole('link', { name: 'Descubrir ropa' })
    const accessories = screen.getByRole('link', { name: 'Ver accesorios' })

    expect(screen.getByRole('heading', { name: 'Muévete a tu manera.' })).toBeInTheDocument()
    expect(clothing).toHaveAttribute('href', '#ropa')
    expect(accessories).toHaveAttribute('href', '#accesorios')
    await user.tab()
    expect(clothing).toHaveFocus()
    await user.tab()
    expect(accessories).toHaveFocus()
  })

  it('uses a compact non-sticky hero on desktop and mobile', () => {
    const heroJourneyCss = globalsCss.match(/\.hero-journey\s*\{([^}]*)\}/)?.[1] ?? ''
    const heroSectionCss = globalsCss.match(/\.hero-section\s*\{([^}]*)\}/)?.[1] ?? ''
    const mobileCss = globalsCss.match(/@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(heroJourneyCss).toContain('min-height: auto')
    expect(heroSectionCss).toContain('position: relative')
    expect(heroSectionCss).toContain('height: min(88svh, 900px)')
    expect(mobileCss).toMatch(/\.hero-section\s*\{[^}]*height:\s*82svh/)
    expect(globalsCss).not.toContain('.hero-category-cue')
  })

  it('renders the calm Fyther Current without a repeated marquee', () => {
    const { container } = render(<MotionTrack />)
    const rail = screen.getByRole('region', {
      name: 'ORIGINALES · CORREOS DE COSTA RICA · APARTADOS · RESPUESTA EN MENOS DE 24H',
    })

    expect(rail).toHaveClass('current-rail')
    expect(rail).toHaveAttribute('data-current')
    expect(rail.querySelectorAll('p span')).toHaveLength(3)
    expect(container.querySelector('.current-line')).toHaveAttribute('aria-hidden', 'true')
  })

  it('provides the Fyther brand-section anchor', () => {
    const { container } = render(<EditorialStory />)
    expect(container.querySelector('.editorial-story')).toHaveAttribute('id', 'fyther')
  })
})
