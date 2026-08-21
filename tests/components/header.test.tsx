import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
    media: '(min-width: 769px)',
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
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('gives the logo a calm 64px capsule without absolute cropping', () => {
    const headerInnerCss = globalsCss.match(/\.header-inner\s*\{([^}]*)\}/)?.[1] ?? ''
    const headerLogoCss = globalsCss.match(/\.wordmark \.brand-mark img\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(headerInnerCss).toContain('min-height: 64px')
    expect(headerInnerCss).toMatch(/padding:\s*4px 16px|padding-inline:\s*16px/)
    expect(headerLogoCss).toContain('position: static')
    expect(headerLogoCss).toContain('object-fit: contain')
  })

  it('scopes menu locking to mobile and clears fixed-header route content', () => {
    expect(globalsCss.slice(0, mobileCssStart)).not.toContain('body[data-menu-open]')
    expect(mobileCss).toMatch(/body\[data-menu-open\]\s*\{[^}]*overflow:\s*hidden/)
    expect(mobileCss).toMatch(/\.catalog-hero,[\s\S]*\.policy-page\s*\{[^}]*padding-top:\s*92px/)
  })

  it('keeps the 768px mobile logo centered while the scrolled header scales', () => {
    const tabletCss = globalsCss.match(/@media \(width: 768px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(tabletCss).toMatch(/\.wordmark \.brand-mark\s*\{[^}]*transform-origin:\s*center/)
  })

  it('removes the logo scale and its transition under reduced motion', () => {
    const reducedMotionCss = globalsCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? ''

    expect(reducedMotionCss).toMatch(/\.wordmark \.brand-mark\s*\{[^}]*transform:\s*none !important;[^}]*transition:\s*none !important/)
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
    expect(screen.getByRole('link', { name: 'Ropa' })).toHaveAttribute('href', '/catalogo?categoria=Ropa')
    expect(screen.getByRole('link', { name: 'Accesorios' })).toHaveAttribute('href', '/catalogo?categoria=Accesorios')
    expect(screen.getByRole('link', { name: 'Seguir pedido' })).toHaveAttribute('href', '/envios-apartados')
    expect(screen.queryByRole('link', { name: 'Descubrir' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Colección' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nosotras' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carrito, 2 productos/i })).toBeInTheDocument()
    expect(screen.queryByText(/modo demo/i)).not.toBeInTheDocument()
  })

  it('initializes its scrolled state from the current window position', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(41)

    const { container } = render(<Header />)

    expect(container.querySelector('header')).toHaveClass('site-header', 'is-scrolled')
  })

  it('coalesces scroll updates into one animation frame and cleans up the listener', () => {
    const scrollY = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    let frameCallback: FrameRequestCallback | undefined
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallback = callback
      return 17
    })
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { container, unmount } = render(<Header />)
    const scrollRegistration = addEventListener.mock.calls.find(([type]) => type === 'scroll')

    expect(scrollRegistration).toEqual(['scroll', expect.any(Function), { passive: true }])
    expect(container.querySelector('header')).not.toHaveClass('is-scrolled')

    scrollY.mockReturnValue(41)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
    })

    expect(requestFrame).toHaveBeenCalledOnce()
    expect(container.querySelector('header')).not.toHaveClass('is-scrolled')

    act(() => frameCallback?.(0))
    expect(container.querySelector('header')).toHaveClass('is-scrolled')

    scrollY.mockReturnValue(0)
    act(() => window.dispatchEvent(new Event('scroll')))
    unmount()

    expect(cancelFrame).toHaveBeenCalledWith(17)
    expect(removeEventListener).toHaveBeenCalledWith('scroll', scrollRegistration?.[1])

    act(() => window.dispatchEvent(new Event('scroll')))
    expect(requestFrame).toHaveBeenCalledTimes(2)
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

    expect(screen.getByRole('link', { name: 'Ropa' })).toHaveFocus()
  })

  it('returns focus to the menu button when Escape closes the navigation', async () => {
    const user = userEvent.setup()
    render(<Header />)

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await user.tab()
    await user.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus()
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
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 769px)')

    act(() => desktopMedia.setDesktop(true))

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(document.body).not.toHaveAttribute('data-menu-open')
  })

  it('keeps all store, service, legal, and contact links in the footer', () => {
    render(<Footer />)

    const storeLinks = screen.getByText('Tienda').parentElement?.querySelectorAll('a') ?? []
    expect(Array.from(storeLinks).map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Ropa', '/catalogo?categoria=Ropa'],
      ['Accesorios', '/catalogo?categoria=Accesorios'],
      ['Carrito', '/carrito'],
      ['Seguir pedido', '/envios-apartados'],
    ])
    expect(screen.getByRole('link', { name: 'Envíos y apartados' })).toHaveAttribute('href', '/envios-apartados')
    expect(screen.getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacidad')
    expect(screen.getByRole('link', { name: 'Términos' })).toHaveAttribute('href', '/terminos')
    expect(screen.getByRole('link', { name: 'fytherstore@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:fytherstore@gmail.com',
    )
  })

  it('shows editorial movement media and the exact service promises', () => {
    render(<Footer />)
    const editorialImage = screen.getByRole('img', { name: /amigas/i })

    expect(decodeURIComponent(editorialImage.getAttribute('src') ?? '')).toContain(
      '/editorial/footer-community-v2.webp',
    )
    expect(
      within(screen.getByRole('list', { name: 'Servicio Fyther' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Productos originales',
      'Correos de Costa Rica',
      'Sinpe y apartados',
      'Respuesta en menos de 24 horas',
    ])
  })

  it('uses the editorial radius for the footer media without changing link touch targets', () => {
    const footerMediaCss = globalsCss.match(/\.footer-media\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(footerMediaCss).toContain('border-radius: var(--radius-editorial)')
    expect(footerMediaCss).toContain('overflow: hidden')
  })
})
