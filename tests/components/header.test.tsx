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
const compactMobileCss = globalsCss.slice(mobileCssEnd)

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

  it('gives footer links full touch targets on mobile', () => {
    const footerLinksCss = globalsCss.match(/\.footer-links a\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(footerLinksCss).toContain('min-height: 44px')
    expect(footerLinksCss).toContain('align-items: center')
    expect(compactMobileCss).toMatch(/\.footer-links a\s*\{[^}]*min-height:\s*48px/)
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

    expect(screen.getByText('Muévete a tu manera.')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Explorar Fyther' })).toBeInTheDocument()
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
    expect(screen.getByRole('link', { name: 'Fyther Store, inicio' }).querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('fyther-wordmark-header.webp'),
    )
    expect(screen.getByText(/© \d{4} Fyther Store/)).toBeInTheDocument()
    expect(screen.getByText('Costa Rica')).toBeInTheDocument()
  })

  it('renders the campaign as a decorative full-footer backdrop', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('.site-footer')
    const backdrop = footer?.querySelector('.footer-backdrop')
    const campaignImage = backdrop?.querySelector('img')
    const footerTop = footer?.querySelector('.footer-top')

    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    expect(campaignImage).toHaveAttribute('alt', '')
    expect(campaignImage).toHaveAttribute('data-nimg', 'fill')
    expect(campaignImage).toHaveAttribute('sizes', '100vw')
    expect(decodeURIComponent(campaignImage?.getAttribute('src') ?? '')).toContain(
      '/editorial/footer-product-campaign-v3.webp',
    )
    expect(footer?.querySelector('.footer-scrim')).toHaveAttribute('aria-hidden', 'true')
    expect(footerTop?.children).toHaveLength(1)
    expect(footerTop?.firstElementChild).toHaveClass('footer-content')
    expect(screen.queryByRole('img', { name: /prendas|campaña|campaign/i })).not.toBeInTheDocument()
  })

  it('keeps the exact footer service promises', () => {
    render(<Footer />)

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

  it('uses the campaign as a stacked full-background composition', () => {
    const siteFooterCss = globalsCss.match(/\.site-footer\s*\{([^}]*)\}/)?.[1] ?? ''
    const footerBackdropCss = globalsCss.match(/\.footer-backdrop\s*\{([^}]*)\}/)?.[1] ?? ''
    const footerBackdropImageCss = globalsCss.match(/\.footer-backdrop img\s*\{([^}]*)\}/)?.[1] ?? ''
    const footerScrimCss = globalsCss.match(/\.footer-scrim\s*\{([^}]*)\}/)?.[1] ?? ''
    const footerTopBottomCss = globalsCss.match(/\.footer-top, \.footer-bottom\s*\{([^}]*)\}/)?.[1] ?? ''
    const footerContentCss = globalsCss.match(/\.footer-content\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(siteFooterCss).toContain('position: relative')
    expect(siteFooterCss).toContain('overflow: hidden')
    expect(siteFooterCss).toContain('isolation: isolate')
    expect(siteFooterCss).toContain('background: var(--color-night-raised)')
    expect(siteFooterCss).toContain('min-height: 520px')
    expect(footerBackdropCss).toMatch(/position:\s*absolute/)
    expect(footerBackdropCss).toMatch(/inset:\s*0/)
    expect(footerBackdropCss).toMatch(/z-index:\s*0/)
    expect(footerBackdropImageCss).toContain('width: 100%')
    expect(footerBackdropImageCss).toContain('height: 100%')
    expect(footerBackdropImageCss).toContain('object-fit: cover')
    expect(footerBackdropImageCss).toMatch(/object-position:\s*[^;]+/)
    expect(footerScrimCss).toMatch(/position:\s*absolute/)
    expect(footerScrimCss).toMatch(/inset:\s*0/)
    expect(footerScrimCss).toMatch(/z-index:\s*1/)
    expect(footerScrimCss).toContain('linear-gradient')
    expect(footerTopBottomCss).toContain('position: relative')
    expect(footerTopBottomCss).toContain('z-index: 2')
    expect(footerContentCss).toContain('width: min(100%, 620px)')
    expect(footerContentCss).toContain('margin-left: auto')
    expect(footerContentCss).not.toMatch(/background|border-radius/)
  })

  it('keeps the full-background structure free of the split grid override', () => {
    expect(globalsCss).not.toMatch(/\.footer-top\s*\{[^}]*grid-template-columns/)
  })

  it('keeps the mobile footer readable in one flow without horizontal overflow', () => {
    expect(mobileCss).toMatch(/\.site-footer\s*\{[^}]*min-height:\s*0/)
    expect(mobileCss).toMatch(/\.footer-backdrop img\s*\{[^}]*object-position:\s*[^}]+/)
    expect(mobileCss).toMatch(/\.footer-scrim\s*\{[^}]*linear-gradient\(180deg/)
    expect(mobileCss).toMatch(/\.footer-top\s*\{[^}]*display:\s*block/)
    expect(mobileCss).toMatch(/\.footer-content\s*\{[^}]*width:\s*100%;[^}]*margin-left:\s*0/)
    expect(compactMobileCss).toMatch(/\.footer-trust\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
    expect(compactMobileCss).toMatch(/\.footer-trust li\s*\{[^}]*font-size:\s*0\.875rem/)
    expect(compactMobileCss).toMatch(/\.footer-contact a\s*\{[^}]*min-height:\s*48px;[^}]*overflow-wrap:\s*anywhere/)
    expect(compactMobileCss).toMatch(/\.footer-bottom\s*\{[^}]*margin-top:\s*1\.75rem/)
  })
})
