import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Header from '@/components/Header'

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ count: 2 }),
}))

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')
const mobileCssStart = globalsCss.indexOf('@media (max-width: 767px)')
const mobileCssEnd = globalsCss.indexOf('@media (max-width: 560px)')
const mobileCss = globalsCss.slice(mobileCssStart, mobileCssEnd)

function installDesktopMediaQuery() {
  let matches = false
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQuery = {
    get matches() { return matches },
    media: '(min-width: 768px)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.delete(listener)
    }),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))

  return {
    setDesktop(nextMatches: boolean) {
      matches = nextMatches
      const event = { matches, media: mediaQuery.media } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  }
}

describe('Header', () => {
  let desktopMedia: ReturnType<typeof installDesktopMediaQuery>

  beforeEach(() => {
    desktopMedia = installDesktopMediaQuery()
    delete document.body.dataset.menuOpen
  })

  afterEach(() => {
    delete document.body.dataset.menuOpen
    vi.unstubAllGlobals()
  })

  it('keeps the capsule at its stable 52px height', () => {
    const headerInnerCss = globalsCss.match(/\.header-inner\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(headerInnerCss).toContain('min-height: 52px')
    expect(headerInnerCss).toMatch(/padding:\s*0 12px|padding-inline:\s*12px/)
    expect(headerInnerCss).not.toMatch(/padding:\s*12px(?:;|$)/)
  })

  it('scopes menu locking to mobile and clears fixed-header route content', () => {
    expect(globalsCss.slice(0, mobileCssStart)).not.toContain('body[data-menu-open]')
    expect(mobileCss).toMatch(/body\[data-menu-open\]\s*\{[^}]*overflow:\s*hidden/)
    expect(mobileCss).toMatch(/\.catalog-hero,[\s\S]*\.policy-page\s*\{[^}]*padding-top:\s*92px/)
  })

  it('gives footer links full touch targets', () => {
    const footerLinksCss = globalsCss.match(/\.footer-links a\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(footerLinksCss).toContain('min-height: 44px')
    expect(footerLinksCss).toContain('align-items: center')
  })

  it('renders the official mark and primary store navigation', () => {
    render(<Header />)

    const homeLink = screen.getByRole('link', { name: 'Fyther Store, inicio' })

    expect(homeLink.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Descubrir' })).toHaveAttribute('href', '/#descubrir')
    expect(screen.getByRole('link', { name: 'Colección' })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('link', { name: 'Nosotras' })).toHaveAttribute('href', '/#fyther')
    expect(screen.getByRole('link', { name: /carrito, 2 productos/i })).toBeInTheDocument()
    expect(screen.queryByText(/modo demo/i)).not.toBeInTheDocument()
  })

  it('opens and closes the mobile menu', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButton = screen.getByRole('button', { name: 'Abrir menú' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)

    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('moves focus from the menu button into the revealed navigation', async () => {
    const user = userEvent.setup()
    render(<Header />)

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await user.tab()

    expect(screen.getByRole('link', { name: 'Descubrir' })).toHaveFocus()
  })

  it('cleans the body lock when closed and unmounted', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Header />)

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(document.body.dataset.menuOpen).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(document.body).not.toHaveAttribute('data-menu-open')

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    unmount()
    expect(document.body).not.toHaveAttribute('data-menu-open')
  })

  it('closes and unlocks when the viewport crosses to desktop', async () => {
    const user = userEvent.setup()
    render(<Header />)

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))

    act(() => desktopMedia.setDesktop(true))

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(document.body).not.toHaveAttribute('data-menu-open')
  })
})
