import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import SalesRail from '@/components/site/SalesRail'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

describe('HeroMedia', () => {
  it('renders a single static, art-directed hero without video or scroll controls', () => {
    const { container } = render(<HeroMedia />)
    const journey = container.querySelector('.hero-journey')
    const picture = container.querySelector('.hero-still-frame')
    const mobileSource = picture?.querySelector('source')
    const heroImage = screen.getByRole('img', {
      name: 'Maleta Fyther abierta con prendas, calzado y accesorios deportivos',
    })

    expect(journey).toHaveAttribute('id', 'descubrir')
    expect(journey).toHaveAttribute('data-scene', 'hero')
    expect(journey).toHaveAttribute('data-hero-static', 'true')
    expect(journey).toHaveClass('hero-journey-static')
    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-category-cue')).not.toBeInTheDocument()
    expect(mobileSource).toHaveAttribute('media', '(max-width: 767px)')
    expect(mobileSource).toHaveAttribute('sizes', '100vw')
    expect(mobileSource?.getAttribute('srcset')).toContain(
      '/_next/image?url=%2Feditorial%2Fhero-product-campaign-v3-mobile.webp',
    )
    expect(heroImage.getAttribute('srcset')).toContain(
      '/_next/image?url=%2Feditorial%2Fhero-product-campaign-v3.webp',
    )
    expect(heroImage).toHaveAttribute('fetchpriority', 'high')
    expect(heroImage).toHaveAttribute('sizes', '100vw')
    expect(heroImage).toHaveStyle({
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    })
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
    const { container } = render(<SalesRail />)
    expect(container.querySelector('#fyther.sales-rail')).toBeInTheDocument()
  })
})
