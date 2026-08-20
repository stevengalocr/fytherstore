import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import EditorialStory from '@/components/site/EditorialStory'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

function installAnimationFrame() {
  let nextId = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  const request = vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextId
    callbacks.set(id, callback)
    return id
  })
  const cancel = vi.fn((id: number) => callbacks.delete(id))

  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)

  return {
    cancel,
    request,
    flush() {
      const queued = [...callbacks.entries()]
      callbacks.clear()
      queued.forEach(([, callback]) => callback(0))
    },
  }
}

function installPreferenceEnvironment(initialReduced = false, initialSaveData = false) {
  let reduced = initialReduced
  let saveData = initialSaveData
  const motionListeners = new Set<(event: MediaQueryListEvent) => void>()
  const connectionListeners = new Set<EventListenerOrEventListenerObject>()
  const mediaQuery = {
    get matches() { return reduced },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') motionListeners.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') motionListeners.delete(listener)
    }),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => motionListeners.add(listener)),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => motionListeners.delete(listener)),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList
  const connection = {
    get saveData() { return saveData },
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'change') connectionListeners.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'change') connectionListeners.delete(listener)
    }),
  }
  const navigatorWithConnection = Object.create(window.navigator) as Navigator & { connection: typeof connection }
  Object.defineProperty(navigatorWithConnection, 'connection', { value: connection })

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))
  vi.stubGlobal('navigator', navigatorWithConnection)

  return {
    connection,
    mediaQuery,
    setReduced(next: boolean) {
      reduced = next
      const event = { matches: reduced, media: mediaQuery.media } as MediaQueryListEvent
      motionListeners.forEach((listener) => listener(event))
    },
    setSaveData(next: boolean) {
      saveData = next
      const event = new Event('change')
      connectionListeners.forEach((listener) => {
        if (typeof listener === 'function') listener(event)
        else listener.handleEvent(event)
      })
    },
  }
}

describe('HeroMedia', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the primary actions usable and the category cue hidden during initial scrub', async () => {
    installPreferenceEnvironment()
    installAnimationFrame()
    const { container } = render(<HeroMedia />)
    const user = userEvent.setup()

    const journey = container.querySelector<HTMLElement>('.hero-journey')
    const scene = container.querySelector('.hero-section')
    expect(journey).toHaveAttribute('id', 'descubrir')
    expect(journey).toHaveAttribute('data-scene', 'hero')
    expect(journey).toHaveAttribute('data-hero-complete', 'false')
    expect(journey?.style.getPropertyValue('--hero-progress')).toBe('0')
    expect(scene).toHaveClass('hero-section')
    expect(container.querySelector('.hero-content')).not.toHaveAttribute('data-reveal')
    expect(screen.getByRole('heading', { name: 'Muévete a tu manera.' })).toBeInTheDocument()
    expect(screen.getByText('Ropa y accesorios elegidos para moverte, compartir y sentirte bien.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Descubrir ropa' })).toHaveAttribute('href', '#ropa')
    expect(screen.getByRole('link', { name: 'Ver accesorios' })).toHaveAttribute('href', '#accesorios')
    expect(screen.getByRole('img', { name: 'Fyther Store, entrada a la colección' })).toBeInTheDocument()
    expect(container.querySelector('.hero-poster-desktop')).toHaveAttribute('src', expect.stringContaining('hero-poster-desktop.webp'))
    expect(container.querySelector('.hero-poster-mobile')).toHaveAttribute('srcset', expect.stringContaining('hero-poster-mobile.webp'))
    const categoryCue = container.querySelector('.hero-category-cue')
    expect(screen.queryByRole('link', { name: 'Continuar a las categorías' })).not.toBeInTheDocument()
    expect(categoryCue).toHaveAttribute('href', '#ropa')
    expect(categoryCue).toHaveAttribute('aria-hidden', 'true')
    expect(categoryCue).toHaveAttribute('tabindex', '-1')
    expect(screen.queryByText(/move different/i)).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('link', { name: 'Descubrir ropa' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Ver accesorios' })).toHaveFocus()
  })

  it('renders the calm Fyther Current without a repeated marquee', () => {
    const { container } = render(<MotionTrack />)

    const rail = screen.getByRole('region', {
      name: 'ORIGINALES · CORREOS DE COSTA RICA · APARTADOS · RESPUESTA EN MENOS DE 24H',
    })
    expect(rail).toHaveClass('current-rail')
    expect(rail).toHaveAttribute('data-current')
    expect(rail.querySelector('p')).toHaveTextContent(
      'ORIGINALES · CORREOS DE COSTA RICA · APARTADOS · RESPUESTA EN MENOS DE 24H',
    )
    expect(rail.querySelectorAll('p span')).toHaveLength(3)
    expect(container.querySelector('.current-line')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.current-line > span')).toHaveLength(1)
  })

  it('uses a short sticky journey on desktop and mobile', () => {
    const heroJourneyCss = globalsCss.match(/\.hero-journey\s*\{([^}]*)\}/)?.[1] ?? ''
    const heroSectionCss = globalsCss.match(/\.hero-section\s*\{([^}]*)\}/)?.[1] ?? ''
    const currentRailCss = globalsCss.match(/\.current-rail\s*\{([^}]*)\}/)?.[1] ?? ''
    const mobileCss = globalsCss.match(/@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(heroJourneyCss).toContain('min-height: 150svh')
    expect(heroSectionCss).toContain('position: sticky')
    expect(heroSectionCss).toContain('height: 100svh')
    expect(mobileCss).toMatch(/\.hero-journey\s*\{[^}]*min-height:\s*120svh/)
    expect(mobileCss).toMatch(/\.hero-section\s*\{[^}]*height:\s*84svh/)
    expect(currentRailCss).toContain('min-height: 112px')
    expect(currentRailCss).toContain('justify-content: space-between')
    expect(currentRailCss).toMatch(/padding:\s*1\.15rem/)
  })

  it('renders a paused scroll-controlled video without autoplay or looping', () => {
    const preferences = installPreferenceEnvironment()
    const animation = installAnimationFrame()
    const { container, unmount } = render(<HeroMedia />)
    const video = container.querySelector('video')!

    expect(video).toBeInTheDocument()
    expect(video.muted).toBe(true)
    expect(video).toHaveAttribute('playsinline')
    expect(video).not.toHaveAttribute('autoplay')
    expect(video).not.toHaveAttribute('loop')
    expect(video).toHaveAttribute('poster', '/editorial/hero-poster-desktop.webp')
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()

    unmount()
    expect(animation.cancel).toHaveBeenCalled()
    expect(preferences.mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(preferences.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it.each([
    ['reduced motion', true, false],
    ['data saver', false, true],
  ])('keeps the primary actions usable and the category cue hidden for %s', async (_label, reduced, saveData) => {
    installPreferenceEnvironment(reduced, saveData)
    installAnimationFrame()
    const { container } = render(<HeroMedia />)
    const user = userEvent.setup()
    const clothingCta = screen.getByRole('link', { name: 'Descubrir ropa' })
    const accessoriesCta = screen.getByRole('link', { name: 'Ver accesorios' })
    const categoryCue = container.querySelector('.hero-category-cue')

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-journey')).toHaveClass('hero-journey-static')
    expect(container.querySelector('.hero-journey')).toHaveAttribute('data-hero-static', 'true')
    expect(screen.getByRole('img', { name: 'Fyther Store, entrada a la colección' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Continuar a las categorías' })).not.toBeInTheDocument()
    expect(categoryCue).toHaveAttribute('aria-hidden', 'true')
    expect(categoryCue).toHaveAttribute('tabindex', '-1')

    await user.tab()
    expect(clothingCta).toHaveFocus()
    await user.tab()
    expect(accessoriesCta).toHaveFocus()
  })

  it('collapses the journey when data saver is enabled during the session', () => {
    const preferences = installPreferenceEnvironment()
    installAnimationFrame()
    const { container } = render(<HeroMedia />)

    expect(container.querySelector('.hero-journey')).not.toHaveClass('hero-journey-static')
    act(() => preferences.setSaveData(true))

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-journey')).toHaveClass('hero-journey-static')
    expect(container.querySelector('.hero-journey')).toHaveAttribute('data-hero-static', 'true')
  })

  it('falls back to the poster and collapses the journey after a video error', () => {
    installPreferenceEnvironment()
    installAnimationFrame()
    const { container } = render(<HeroMedia />)
    const video = container.querySelector('video')!

    act(() => video.dispatchEvent(new Event('error')))

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-journey')).toHaveClass('hero-journey-static')
    expect(screen.getByRole('img', { name: 'Fyther Store, entrada a la colección' })).toBeInTheDocument()
  })

  it('coalesces scroll updates and advances to duration minus one without rewinding', async () => {
    installPreferenceEnvironment()
    const animation = installAnimationFrame()
    const { container } = render(<HeroMedia />)
    const hero = container.querySelector<HTMLElement>('.hero-journey')!
    const categoryCue = container.querySelector<HTMLAnchorElement>('.hero-category-cue')!
    const video = container.querySelector('video')!
    Object.defineProperty(hero, 'offsetHeight', { configurable: true, value: 1500 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 })
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
    vi.spyOn(hero, 'getBoundingClientRect').mockImplementation(() => ({
      top: 100 - window.scrollY,
      bottom: 1600 - window.scrollY,
      left: 0,
      right: 1000,
      width: 1000,
      height: 1500,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    }))
    Object.defineProperty(video, 'duration', { configurable: true, value: 4.233 })

    act(() => {
      video.dispatchEvent(new Event('loadedmetadata'))
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
    })
    expect(animation.request).toHaveBeenCalledTimes(1)

    act(() => animation.flush())
    expect(hero.style.getPropertyValue('--hero-progress')).toBe('0')

    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 1100 })
      window.dispatchEvent(new Event('scroll'))
      animation.flush()
    })
    expect(video.currentTime).toBeCloseTo(3.233, 3)
    expect(hero.style.getPropertyValue('--hero-progress')).toBe('1')
    expect(hero.style.getPropertyValue('--hero-copy-opacity')).toBe('0.28')
    expect(hero.style.getPropertyValue('--hero-copy-shift')).toBe('-24px')
    expect(hero).toHaveAttribute('data-hero-complete', 'true')
    expect(categoryCue).not.toHaveAttribute('aria-hidden')
    expect(categoryCue).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('link', { name: 'Continuar a las categorías' })).toBe(categoryCue)

    const user = userEvent.setup()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Descubrir ropa' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Ver accesorios' })).toHaveFocus()
    await user.tab()
    expect(categoryCue).toHaveFocus()

    act(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 400 })
      window.dispatchEvent(new Event('scroll'))
      animation.flush()
    })
    expect(video.currentTime).toBeCloseTo(3.233, 3)
    expect(hero.style.getPropertyValue('--hero-progress')).toBe('1')
  })

  it('responds to resize and preference changes, then cleans up all listeners', () => {
    const preferences = installPreferenceEnvironment()
    const animation = installAnimationFrame()
    const removeWindowListener = vi.spyOn(window, 'removeEventListener')
    const { container, unmount } = render(<HeroMedia />)

    act(() => {
      animation.flush()
      window.dispatchEvent(new Event('resize'))
    })
    expect(animation.request).toHaveBeenCalledTimes(2)

    act(() => {
      preferences.setReduced(true)
    })
    expect(container.querySelector('video')).not.toBeInTheDocument()

    unmount()
    expect(removeWindowListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeWindowListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(preferences.mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(preferences.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes sticky travel for reduced motion and static runtime fallbacks', () => {
    const reducedMotionCss = globalsCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? ''

    expect(reducedMotionCss).toMatch(/\.hero-journey\s*\{[^}]*min-height:\s*auto/)
    expect(reducedMotionCss).toMatch(/\.hero-section\s*\{[^}]*position:\s*relative[^}]*height:\s*84svh/)
    expect(globalsCss).toMatch(/\.hero-journey-static\s*\{[^}]*min-height:\s*auto/)
    expect(globalsCss).toMatch(/\.hero-journey-static\s+\.hero-section\s*\{[^}]*position:\s*relative[^}]*height:\s*84svh/)
  })

  it('lets hero copy withdraw and reveals the category cue only at completion', () => {
    expect(globalsCss).not.toMatch(/\.hero-content[^\n{]*\{[^}]*\}[\s\S]*?\.hero-content[^\n{]*data-reveal/)
    expect(globalsCss).toMatch(/\.hero-category-cue\s*\{[^}]*visibility:\s*hidden[^}]*opacity:\s*0[^}]*translateY\(12px\)/)
    expect(globalsCss).toMatch(/\.hero-journey\[data-hero-complete='true'\]\s+\.hero-category-cue\s*\{[^}]*visibility:\s*visible[^}]*opacity:\s*1[^}]*translateY\(0\)/)
    expect(globalsCss).not.toMatch(/\.hero-journey\[data-hero-complete='true'\]\s+\.hero-content\s*\{[^}]*pointer-events:\s*none/)
  })

  it('provides the Fyther brand-section anchor', () => {
    const { container } = render(<EditorialStory />)

    expect(container.querySelector('.editorial-story')).toHaveAttribute('id', 'fyther')
  })
})
