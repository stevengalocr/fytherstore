import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, render, screen } from '@testing-library/react'
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

  it('presents the approved warm Spanish hero contract', () => {
    installPreferenceEnvironment()
    installAnimationFrame()
    const { container } = render(<HeroMedia />)

    const hero = container.querySelector('.hero-section')
    expect(hero).toHaveAttribute('id', 'descubrir')
    expect(hero).toHaveAttribute('data-scene', 'hero')
    expect(screen.getByRole('heading', { name: 'Muévete a tu manera.' })).toBeInTheDocument()
    expect(screen.getByText('Ropa y accesorios elegidos para moverte, compartir y sentirte bien.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Descubrir ropa' })).toHaveAttribute('href', '#ropa')
    expect(screen.getByRole('link', { name: 'Ver accesorios' })).toHaveAttribute('href', '#accesorios')
    expect(screen.getByRole('img', { name: 'Fyther Store, entrada a la colección' })).toBeInTheDocument()
    expect(container.querySelector('.hero-poster-desktop')).toHaveAttribute('src', expect.stringContaining('hero-poster-desktop.webp'))
    expect(container.querySelector('.hero-poster-mobile')).toHaveAttribute('srcset', expect.stringContaining('hero-poster-mobile.webp'))
    expect(screen.queryByText(/move different/i)).not.toBeInTheDocument()
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
    const heroSectionCss = globalsCss.match(/\.hero-section\s*\{([^}]*)\}/)?.[1] ?? ''
    const heroSceneCss = globalsCss.match(/\.hero-scene\s*\{([^}]*)\}/)?.[1] ?? ''
    const currentRailCss = globalsCss.match(/\.current-rail\s*\{([^}]*)\}/)?.[1] ?? ''
    const mobileCss = globalsCss.match(/@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(heroSectionCss).toContain('min-height: 150svh')
    expect(heroSceneCss).toContain('position: sticky')
    expect(heroSceneCss).toContain('height: 100svh')
    expect(mobileCss).toMatch(/\.hero-section\s*\{[^}]*min-height:\s*120svh/)
    expect(mobileCss).toMatch(/\.hero-scene\s*\{[^}]*height:\s*84svh/)
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
  ])('uses only the static poster for %s', (_label, reduced, saveData) => {
    installPreferenceEnvironment(reduced, saveData)
    installAnimationFrame()
    const { container } = render(<HeroMedia />)

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Fyther Store, entrada a la colección' })).toBeInTheDocument()
  })

  it('coalesces scroll updates and advances to duration minus one without rewinding', () => {
    installPreferenceEnvironment()
    const animation = installAnimationFrame()
    const { container } = render(<HeroMedia />)
    const hero = container.querySelector<HTMLElement>('.hero-section')!
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
    expect(hero).toHaveAttribute('data-hero-complete', 'true')

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

  it('provides the Fyther brand-section anchor', () => {
    const { container } = render(<EditorialStory />)

    expect(container.querySelector('.editorial-story')).toHaveAttribute('id', 'fyther')
  })
})
