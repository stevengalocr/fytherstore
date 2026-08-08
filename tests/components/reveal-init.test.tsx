import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RevealInit from '@/components/RevealInit'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

type ObserverHarness = {
  callback: IntersectionObserverCallback
  disconnect: ReturnType<typeof vi.fn>
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
}

function installMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: reduced,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList)))
}

function installIntersectionObserver() {
  let harness: ObserverHarness | undefined
  const constructor = vi.fn(function (
    this: IntersectionObserver,
    callback: IntersectionObserverCallback,
  ) {
    harness = {
      callback,
      disconnect: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
    }
    return harness
  })
  vi.stubGlobal('IntersectionObserver', constructor)
  return { constructor, get harness() { return harness } }
}

describe('RevealInit', () => {
  beforeEach(() => {
    vi.stubGlobal('innerHeight', 1000)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 17)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('finishes reveals and currents immediately in reduced motion without observers or listeners', () => {
    installMatchMedia(true)
    const observer = installIntersectionObserver()
    const addEventListener = vi.spyOn(window, 'addEventListener')

    const { container } = render(
      <>
        <RevealInit />
        <div data-reveal>Reveal</div>
        <section data-current>Current</section>
      </>,
    )

    expect(container.querySelector('[data-reveal]')).toHaveAttribute('data-reveal', 'on')
    expect(container.querySelector<HTMLElement>('[data-current]')?.style.getPropertyValue('--current-progress')).toBe('1')
    expect(observer.constructor).not.toHaveBeenCalled()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    expect(addEventListener).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything())
    expect(addEventListener).not.toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('reveals once, updates local current progress in RAF, and cleans up', () => {
    installMatchMedia(false)
    const observer = installIntersectionObserver()
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    let frameCallback: FrameRequestCallback | undefined
    vi.mocked(window.requestAnimationFrame).mockImplementation((callback) => {
      frameCallback = callback
      return 17
    })

    const { container, unmount } = render(
      <>
        <RevealInit />
        <div data-reveal>Reveal</div>
        <section data-current>Current</section>
      </>,
    )
    const reveal = container.querySelector<HTMLElement>('[data-reveal]')!
    const current = container.querySelector<HTMLElement>('[data-current]')!
    vi.spyOn(current, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      height: 100,
    } as DOMRect)

    const scrollCall = addEventListener.mock.calls.find(([type]) => type === 'scroll')
    const resizeCall = addEventListener.mock.calls.find(([type]) => type === 'resize')
    expect(observer.constructor).toHaveBeenCalledWith(expect.any(Function), { threshold: 0.12 })
    expect(observer.harness?.observe).toHaveBeenCalledWith(reveal)
    expect(scrollCall?.[2]).toEqual({ passive: true })
    expect(resizeCall).toBeDefined()

    act(() => {
      observer.harness?.callback([
        { isIntersecting: true, target: reveal } as unknown as IntersectionObserverEntry,
      ], observer.harness as unknown as IntersectionObserver)
    })
    expect(reveal).toHaveAttribute('data-reveal', 'on')
    expect(observer.harness?.unobserve).toHaveBeenCalledWith(reveal)

    const requestUpdate = scrollCall?.[1] as EventListener
    act(() => {
      requestUpdate(new Event('scroll'))
      requestUpdate(new Event('scroll'))
    })
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)

    act(() => frameCallback?.(0))
    expect(current.style.getPropertyValue('--current-progress')).toBe('0.455')

    act(() => requestUpdate(new Event('scroll')))
    unmount()

    expect(observer.harness?.disconnect).toHaveBeenCalledOnce()
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(17)
    expect(removeEventListener).toHaveBeenCalledWith('scroll', requestUpdate)
    expect(removeEventListener).toHaveBeenCalledWith('resize', resizeCall?.[1])
  })
})
