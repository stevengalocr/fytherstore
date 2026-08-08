import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HeroMedia from '@/components/site/HeroMedia'
import MotionTrack from '@/components/site/MotionTrack'
import WhyFyther from '@/components/site/WhyFyther'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

type VideoObserverHarness = {
  callback: IntersectionObserverCallback
  disconnect: ReturnType<typeof vi.fn>
  observe: ReturnType<typeof vi.fn>
}

function installVideoObserver() {
  let harness: VideoObserverHarness | undefined
  const constructor = vi.fn(function (
    this: IntersectionObserver,
    callback: IntersectionObserverCallback,
  ) {
    harness = {
      callback,
      disconnect: vi.fn(),
      observe: vi.fn(),
    }
    return harness
  })
  vi.stubGlobal('IntersectionObserver', constructor)
  return { constructor, get harness() { return harness } }
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
    const heroSectionCss = globalsCss.match(/\.hero-section\s*\{([^}]*)\}/)?.[1] ?? ''
    const heroContentCss = globalsCss.match(/\.hero-content\s*\{([^}]*)\}/)?.[1] ?? ''
    const currentRailCss = globalsCss.match(/\.current-rail\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(heroSectionCss).toContain('min-height: 96svh')
    expect(heroContentCss).toContain('min-height: 96svh')
    expect(currentRailCss).toContain('min-height: 112px')
    expect(currentRailCss).toContain('justify-content: space-between')
    expect(currentRailCss).toMatch(/padding:\s*1\.15rem/)
  })

  it('reacts to reduced-motion changes and removes its listeners on cleanup', () => {
    const preferences = installPreferenceEnvironment()
    const observer = installVideoObserver()
    const { container, unmount } = render(<HeroMedia />)

    expect(container.querySelector('video')).toBeInTheDocument()

    act(() => preferences.setReduced(true))

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    expect(observer.harness?.disconnect).toHaveBeenCalledOnce()

    unmount()
    expect(preferences.mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(preferences.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('reacts when data saver is enabled during the session', () => {
    const preferences = installPreferenceEnvironment()
    installVideoObserver()
    const { container } = render(<HeroMedia />)

    expect(container.querySelector('video')).toBeInTheDocument()

    act(() => preferences.setSaveData(true))

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('plays video only while intersecting and disconnects the observer on cleanup', async () => {
    installPreferenceEnvironment()
    const observer = installVideoObserver()
    const { container, unmount } = render(<HeroMedia />)
    const video = container.querySelector('video')!

    expect(observer.constructor).toHaveBeenCalledWith(expect.any(Function), { threshold: 0.2 })
    expect(observer.harness?.observe).toHaveBeenCalledWith(video)

    await act(async () => {
      observer.harness?.callback([
        { isIntersecting: true, target: video } as unknown as IntersectionObserverEntry,
      ], observer.harness as unknown as IntersectionObserver)
    })
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()

    act(() => {
      observer.harness?.callback([
        { isIntersecting: false, target: video } as unknown as IntersectionObserverEntry,
      ], observer.harness as unknown as IntersectionObserver)
    })
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce()

    unmount()
    expect(observer.harness?.disconnect).toHaveBeenCalledOnce()
  })

  it('provides the Fyther brand-section anchor', () => {
    const { container } = render(<WhyFyther />)

    expect(container.querySelector('.why-fyther')).toHaveAttribute('id', 'fyther')
  })
})
