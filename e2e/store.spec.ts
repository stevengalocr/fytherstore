import { expect, test, type Locator, type Page, type Request } from '@playwright/test'

const forbiddenCommerceCopy = /BilBildin|modo live|configuraci[oó]n|configurad[oa]s?|modo demo|productos de demostraci[oó]n|simulaci[oó]n|Motion Tee|Training Layer|Daily Bag|Recovery Cap/i
const exposedConfiguration = /BilBildin|modo live|configuraci[oó]n|configurad[oa]s?|Supabase|service_role|\bkey\b|endpoint|\bdemo\b|simulaci/i
const frameworkDialog = '[data-nextjs-dialog]'
const backendTimeout = 15_000

type VideoFrameSample = {
  luminances: number[]
  meanLuminance: number
  luminanceVariance: number
  opaqueSamples: number
}

type FocusTraversal = {
  encountered: Set<string>
  initialIdentity: string | null
  lastOrder: number
}

function projectMode(projectName: string) {
  if (projectName.endsWith('-configured')) return 'configured' as const
  if (projectName.endsWith('-unconfigured')) return 'unconfigured' as const
  throw new Error(`Unknown E2E project mode: ${projectName}`)
}

function isBenignAbort(request: Request, errorText: string) {
  const aborted = /ERR_ABORTED|NS_BINDING_ABORTED|cancelled|canceled/i.test(errorText)
  const url = new URL(request.url())
  const nextNavigationPrefetch = request.method() === 'GET'
    && request.resourceType() === 'fetch'
    && url.searchParams.has('_rsc')
  return aborted && (request.isNavigationRequest() || request.resourceType() === 'image' || request.resourceType() === 'media' || nextNavigationPrefetch)
}

function watchBrowserErrors(page: Page) {
  const issues: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? 'unknown failure'
    if (!isBenignAbort(request, errorText)) {
      issues.push(`requestfailed: ${request.method()} ${request.url()} (${errorText})`)
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 400) issues.push(`http ${response.status()}: ${response.url()}`)
  })

  return {
    expectClean() {
      expect(issues).toEqual([])
      issues.length = 0
    },
  }
}

async function expectHealthyPage(page: Page) {
  await expect(page.locator(frameworkDialog)).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => {
    const rootFits = document.documentElement.scrollWidth <= window.innerWidth + 1
    const bodyFits = document.body.scrollWidth <= window.innerWidth + 1
    return rootFits && bodyFits
  })).toBe(true)
}

function createFocusTraversal(): FocusTraversal {
  return {
    encountered: new Set<string>(),
    initialIdentity: null,
    lastOrder: -1,
  }
}

async function readActiveFocus(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    if (!active || active === document.body || active === document.documentElement) {
      return { isDocument: true, identity: 'document', label: 'document', order: -1 }
    }

    const segments: string[] = []
    let current: HTMLElement | null = active
    while (current && current !== document.body) {
      if (current.id) {
        segments.unshift(`#${current.id}`)
        break
      }
      const parent: HTMLElement | null = current.parentElement
      if (!parent) break
      const sameTagSiblings = [...parent.children].filter((sibling) => sibling.tagName === current?.tagName)
      const siblingIndex = sameTagSiblings.indexOf(current) + 1
      segments.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${siblingIndex})`)
      current = parent
    }

    return {
      isDocument: false,
      identity: segments.join(' > '),
      label: active.getAttribute('aria-label') || active.textContent?.trim().replace(/\s+/g, ' ') || active.tagName.toLowerCase(),
      order: [...document.querySelectorAll('*')].indexOf(active),
    }
  })
}

async function tabTo(page: Page, target: Locator, traversal = createFocusTraversal(), maxPresses = 48) {
  await expect(target).toBeVisible()
  const startingFocus = await readActiveFocus(page)
  if (!startingFocus.isDocument && !traversal.encountered.has(startingFocus.identity)) {
    traversal.initialIdentity ??= startingFocus.identity
    traversal.encountered.add(startingFocus.identity)
    traversal.lastOrder = startingFocus.order
  }

  for (let press = 0; press < maxPresses; press += 1) {
    await page.keyboard.press('Tab')
    const focus = await readActiveFocus(page)
    if (focus.isDocument) {
      throw new Error('Focus traversal wrapped to body/document')
    }
    if (focus.identity === traversal.initialIdentity) {
      throw new Error(`Focus traversal wrapped to initial element: ${focus.label}`)
    }
    if (traversal.encountered.has(focus.identity)) {
      throw new Error(`Focus traversal wrapped to repeated element: ${focus.label}`)
    }
    if (focus.order <= traversal.lastOrder) {
      throw new Error(`Focus traversal wrapped backward from DOM order ${traversal.lastOrder} to ${focus.order}: ${focus.label}`)
    }

    traversal.encountered.add(focus.identity)
    traversal.initialIdentity ??= focus.identity
    traversal.lastOrder = focus.order
    if (await target.evaluate((element) => element === document.activeElement)) return focus
  }
  throw new Error(`Could not reach ${await target.evaluate((element) => element.outerHTML)} after ${maxPresses} Tab presses`)
}

async function settleAndSampleVideoFrame(video: Locator): Promise<VideoFrameSample> {
  return video.evaluate(async (media) => {
    const element = media as HTMLVideoElement
    const frameVideo = element as HTMLVideoElement & {
      cancelVideoFrameCallback?: (handle: number) => void
      requestVideoFrameCallback?: (callback: () => void) => number
    }

    const waitForSeek = async () => {
      if (!element.seeking) return
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          element.removeEventListener('seeked', onSeeked)
          reject(new Error(`Video seek did not settle at ${element.currentTime.toFixed(3)}s`))
        }, 5_000)
        const onSeeked = () => {
          window.clearTimeout(timeout)
          resolve()
        }
        element.addEventListener('seeked', onSeeked, { once: true })
        if (!element.seeking) {
          element.removeEventListener('seeked', onSeeked)
          window.clearTimeout(timeout)
          resolve()
        }
      })
    }

    const waitForPaint = async () => {
      await new Promise<void>((resolve) => {
        let complete = false
        let frameHandle: number | undefined
        let timeout: number | undefined
        const finish = () => {
          if (complete) return
          complete = true
          if (timeout !== undefined) window.clearTimeout(timeout)
          resolve()
        }
        const animationFrameFallback = () => {
          window.requestAnimationFrame(() => window.requestAnimationFrame(finish))
        }

        if (typeof frameVideo.requestVideoFrameCallback === 'function') {
          frameHandle = frameVideo.requestVideoFrameCallback(finish)
          timeout = window.setTimeout(() => {
            if (frameHandle !== undefined) frameVideo.cancelVideoFrameCallback?.(frameHandle)
            animationFrameFallback()
          }, 1_000)
        } else {
          animationFrameFallback()
        }
      })
    }

    await waitForSeek()
    await waitForPaint()
    if (element.seeking) {
      await waitForSeek()
      await waitForPaint()
    }

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 18
    const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true })
    if (!context) throw new Error('Could not create video frame sampling canvas')
    context.drawImage(element, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const luminances: number[] = []
    let opaqueSamples = 0
    for (let y = 1; y < canvas.height; y += 3) {
      for (let x = 1; x < canvas.width; x += 4) {
        const offset = (y * canvas.width + x) * 4
        const red = pixels[offset]
        const green = pixels[offset + 1]
        const blue = pixels[offset + 2]
        const alpha = pixels[offset + 3]
        if (alpha > 0) opaqueSamples += 1
        luminances.push((0.2126 * red) + (0.7152 * green) + (0.0722 * blue))
      }
    }
    const meanLuminance = luminances.reduce((total, value) => total + value, 0) / luminances.length
    const luminanceVariance = luminances.reduce((total, value) => (
      total + ((value - meanLuminance) ** 2)
    ), 0) / luminances.length

    return { luminances, meanLuminance, luminanceVariance, opaqueSamples }
  })
}

async function scrollInstantly(page: Page, top: number) {
  await page.evaluate((nextTop) => {
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, nextTop)
    root.style.scrollBehavior = previousBehavior
  }, top)
  await expect.poll(() => page.evaluate((nextTop) => Math.abs(window.scrollY - nextTop), top)).toBeLessThanOrEqual(1)
}

async function focusByKeyboard(page: Page, selector: string, maxPresses = 48) {
  const target = page.locator(selector).first()
  await expect(target).toBeVisible()
  const firstFocusable = page.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])').filter({ visible: true }).first()
  await expect(firstFocusable).toBeVisible()
  await firstFocusable.focus()
  await tabTo(page, target, createFocusTraversal(), maxPresses)
  return target
}

async function expectNoOverlap(page: Page, selectors: string[]) {
  const boxes = await Promise.all(selectors.map((selector) => page.locator(selector).boundingBox()))
  boxes.forEach((box, index) => expect(box, `${selectors[index]} must be visible`).not.toBeNull())
  for (let index = 0; index < boxes.length; index += 1) {
    const first = boxes[index]
    if (!first) continue
    for (let otherIndex = index + 1; otherIndex < boxes.length; otherIndex += 1) {
      const second = boxes[otherIndex]
      if (!second) continue
      const overlaps = first.x < second.x + second.width
        && first.x + first.width > second.x
        && first.y < second.y + second.height
        && first.y + first.height > second.y
      expect(overlaps, `${selectors[index]} overlaps ${selectors[otherIndex]}`).toBe(false)
    }
  }
}

async function expectVerticalOrder(page: Page, selectors: string[]) {
  const boxes = await Promise.all(selectors.map((selector) => page.locator(selector).boundingBox()))
  boxes.forEach((box, index) => expect(box, `${selectors[index]} must be visible`).not.toBeNull())
  for (let index = 0; index < boxes.length - 1; index += 1) {
    const current = boxes[index]
    const next = boxes[index + 1]
    if (!current || !next) continue
    expect(current.y + current.height, `${selectors[index]} must end before ${selectors[index + 1]}`).toBeLessThanOrEqual(next.y + 1)
  }
}

async function expectNoHorizontalClipping(page: Page, selectors: string[]) {
  const clipped = await page.locator(selectors.join(', ')).evaluateAll((elements) => elements.flatMap((element) => {
    const htmlElement = element as HTMLElement
    const style = getComputedStyle(htmlElement)
    const visible = style.display !== 'none' && style.visibility !== 'hidden' && htmlElement.getClientRects().length > 0
    if (!visible || htmlElement.getAttribute('aria-hidden') === 'true' || htmlElement.clientWidth === 0 || htmlElement.scrollWidth <= htmlElement.clientWidth + 1) return []
    return [{
      element: htmlElement.className || htmlElement.tagName.toLowerCase(),
      clientWidth: htmlElement.clientWidth,
      scrollWidth: htmlElement.scrollWidth,
    }]
  }))
  expect(clipped).toEqual([])
}

async function expectTextContained(page: Page, selector: string) {
  const geometries = await page.locator(selector).evaluateAll((elements) => elements.flatMap((element) => {
    const htmlElement = element as HTMLElement
    const style = getComputedStyle(htmlElement)
    const visible = style.display !== 'none' && style.visibility !== 'hidden' && htmlElement.getClientRects().length > 0
    if (!visible || htmlElement.getAttribute('aria-hidden') === 'true') return []
    const container = htmlElement.parentElement
    if (!container) return []
    const range = document.createRange()
    range.selectNodeContents(htmlElement)
    const textBounds = range.getBoundingClientRect()
    const elementBounds = htmlElement.getBoundingClientRect()
    const containerBounds = container.getBoundingClientRect()
    return [{
      label: htmlElement.textContent?.trim() || htmlElement.className || htmlElement.tagName.toLowerCase(),
      text: { top: textBounds.top, right: textBounds.right, bottom: textBounds.bottom, left: textBounds.left },
      element: { top: elementBounds.top, right: elementBounds.right, bottom: elementBounds.bottom, left: elementBounds.left },
      container: { top: containerBounds.top, right: containerBounds.right, bottom: containerBounds.bottom, left: containerBounds.left },
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      whiteSpace: style.whiteSpace,
    }]
  }))

  expect(geometries.length, `${selector} must match visible text`).toBeGreaterThan(0)
  for (const geometry of geometries) {
    const textInkTolerance = 3
    expect(geometry.whiteSpace, `${geometry.label} must wrap when needed`).not.toBe('nowrap')
    expect(geometry.overflowX, `${geometry.label} must not clip horizontally`).not.toBe('hidden')
    expect(geometry.overflowY, `${geometry.label} must not clip vertically`).not.toBe('hidden')
    expect(geometry.text.top, `${geometry.label} text top`).toBeGreaterThanOrEqual(geometry.element.top - textInkTolerance)
    expect(geometry.text.left, `${geometry.label} text left`).toBeGreaterThanOrEqual(geometry.element.left - textInkTolerance)
    expect(geometry.text.right, `${geometry.label} text right`).toBeLessThanOrEqual(geometry.element.right + textInkTolerance)
    expect(geometry.text.bottom, `${geometry.label} text bottom`).toBeLessThanOrEqual(geometry.element.bottom + textInkTolerance)
    expect(geometry.element.top, `${geometry.label} element top`).toBeGreaterThanOrEqual(geometry.container.top - 1)
    expect(geometry.element.left, `${geometry.label} element left`).toBeGreaterThanOrEqual(geometry.container.left - 1)
    expect(geometry.element.right, `${geometry.label} element right`).toBeLessThanOrEqual(geometry.container.right + 1)
    expect(geometry.element.bottom, `${geometry.label} element bottom`).toBeLessThanOrEqual(geometry.container.bottom + 1)
  }
}

async function inspectImages(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const image = element as HTMLImageElement
    const currentUrl = new URL(image.currentSrc || image.src, document.baseURI)
    const optimizedSource = currentUrl.pathname === '/_next/image'
      ? currentUrl.searchParams.get('url')
      : currentUrl.pathname
    const sourceUrl = new URL(optimizedSource ?? currentUrl.pathname, document.baseURI)
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 24
    const context = canvas.getContext('2d', { willReadFrequently: true })
    let opaquePixels = 0
    let channelRange = 0
    let error = ''

    try {
      context?.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pixels = context?.getImageData(0, 0, canvas.width, canvas.height).data ?? []
      let minimum = 255
      let maximum = 0
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] === 0) continue
        opaquePixels += 1
        minimum = Math.min(minimum, pixels[index], pixels[index + 1], pixels[index + 2])
        maximum = Math.max(maximum, pixels[index], pixels[index + 1], pixels[index + 2])
      }
      channelRange = maximum - minimum
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught)
    }

    return {
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      source: sourceUrl.pathname,
      opaquePixels,
      channelRange,
      error,
    }
  }))
}

async function expectFooterMarkContained(page: Page) {
  const geometry = await page.locator('.footer-wordmark .brand-mark').evaluate((container) => {
    const image = container.querySelector('img')
    if (!image) return null
    const containerBounds = container.getBoundingClientRect()
    const imageBounds = image.getBoundingClientRect()
    return {
      container: {
        top: containerBounds.top,
        right: containerBounds.right,
        bottom: containerBounds.bottom,
        left: containerBounds.left,
        height: containerBounds.height,
      },
      image: {
        top: imageBounds.top,
        right: imageBounds.right,
        bottom: imageBounds.bottom,
        left: imageBounds.left,
        height: imageBounds.height,
      },
    }
  })

  expect(geometry).not.toBeNull()
  if (!geometry) return
  expect(geometry.container.height).toBeGreaterThan(48)
  expect(geometry.image.height).toBeGreaterThan(48)
  expect(geometry.image.top).toBeGreaterThanOrEqual(geometry.container.top - 1)
  expect(geometry.image.left).toBeGreaterThanOrEqual(geometry.container.left - 1)
  expect(geometry.image.right).toBeLessThanOrEqual(geometry.container.right + 1)
  expect(geometry.image.bottom).toBeLessThanOrEqual(geometry.container.bottom + 1)
}

async function revealFullPage(page: Page) {
  const reveals = page.locator('[data-reveal]')
  const revealCount = await reveals.count()
  expect(revealCount).toBeGreaterThan(0)

  for (let index = 0; index < revealCount; index += 1) {
    const reveal = reveals.nth(index)
    await reveal.scrollIntoViewIfNeeded()
    await expect(reveal).toHaveAttribute('data-reveal', 'on', { timeout: 10_000 })
  }

  const footer = page.locator('.site-footer')
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).toBeInViewport()
  await page.evaluate(() => {
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, root.scrollHeight)
    root.style.scrollBehavior = previousBehavior
  })
  await expect.poll(() => page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1)).toBe(true)
  await expect(page.locator('[data-reveal]:not([data-reveal="on"])')).toHaveCount(0)

  await page.evaluate(() => {
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.querySelectorAll<HTMLElement>('.collection-world-grid, .collection-world-filters, .collection-product-rail')
      .forEach((rail) => { rail.scrollLeft = 0 })
    root.style.scrollBehavior = previousBehavior
  })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
  await expect.poll(() => page.locator('.collection-world-grid, .collection-world-filters, .collection-product-rail').evaluateAll((rails) => (
    rails.every((rail) => Math.abs((rail as HTMLElement).scrollLeft) <= 1)
  ))).toBe(true)
}

async function stabilizeForScreenshot(page: Page) {
  await page.evaluate(async () => {
    const stabilityStyleId = 'e2e-screenshot-stability'
    if (!document.getElementById(stabilityStyleId)) {
      const style = document.createElement('style')
      style.id = stabilityStyleId
      style.textContent = `
        *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
        .hero-media video { visibility: hidden !important; }
      `
      document.head.append(style)
    }

    const videoSeeks: Promise<void>[] = []
    for (const video of document.querySelectorAll('video')) {
      video.pause()
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.seekable.length > 0) {
        if (Math.abs(video.currentTime) > 0.001) {
          videoSeeks.push(new Promise<void>((resolve) => {
            video.addEventListener('seeked', () => resolve(), { once: true })
            video.currentTime = 0
          }))
        } else {
          video.currentTime = 0
        }
      }
    }
    await Promise.all(videoSeeks)

    await document.fonts.ready
    const visibleImages = [...document.images].filter((image) => {
      const style = getComputedStyle(image)
      return style.display !== 'none' && style.visibility !== 'hidden' && image.getClientRects().length > 0
    })
    await Promise.all(visibleImages.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
      }
      await image.decode().catch(() => undefined)
    }))

    document.querySelectorAll<HTMLElement>('.collection-world-grid, .collection-world-filters, .collection-product-rail')
      .forEach((rail) => { rail.scrollLeft = 0 })
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })

  const visibleImages = page.locator('img:visible')
  await expect.poll(() => visibleImages.evaluateAll((images) => images.every((image) => {
    const media = image as HTMLImageElement
    return media.complete && media.naturalWidth > 0 && media.naturalHeight > 0
  }))).toBe(true)

  let previousLayout = ''
  let consecutiveMatches = 0
  await expect.poll(async () => {
    const layout = await page.evaluate(() => JSON.stringify({
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      rails: [...document.querySelectorAll<HTMLElement>('.collection-world-grid, .collection-world-filters, .collection-product-rail')]
        .map((rail) => ({ scrollLeft: rail.scrollLeft, scrollWidth: rail.scrollWidth, clientWidth: rail.clientWidth })),
      sections: [...document.querySelectorAll<HTMLElement>('main > section, main > .current-rail')]
        .map((section) => {
          const rect = section.getBoundingClientRect()
          return [rect.x, rect.y, rect.width, rect.height]
        }),
    }))
    consecutiveMatches = layout === previousLayout ? consecutiveMatches + 1 : 0
    previousLayout = layout
    return consecutiveMatches >= 2
  }, { timeout: 10_000 }).toBe(true)

  await expect.poll(() => page.locator('.collection-world-grid, .collection-world-filters, .collection-product-rail').evaluateAll((rails) => (
    rails.every((rail) => Math.abs((rail as HTMLElement).scrollLeft) <= 1)
  ))).toBe(true)
}

function longestDurationSeconds(value: string) {
  return Math.max(0, ...value.split(',').map((part) => {
    const duration = part.trim()
    const parsed = Number.parseFloat(duration)
    if (!Number.isFinite(parsed)) return 0
    return duration.endsWith('ms') ? parsed / 1000 : parsed
  }))
}

async function readProductCardInteraction(card: Locator) {
  return card.evaluate((element) => {
    const style = getComputedStyle(element)
    const image = element.querySelector('.product-image')
    const action = element.querySelector('.product-action')
    const imageStyle = image ? getComputedStyle(image) : null
    const actionStyle = action ? getComputedStyle(action) : null
    const bounds = element.getBoundingClientRect()
    const matrix = (transform: string | null) => {
      if (!transform || transform === 'none') return null
      const value = new DOMMatrixReadOnly(transform)
      return { a: value.a, b: value.b, c: value.c, d: value.d, e: value.e, f: value.f }
    }

    return {
      actionColor: actionStyle?.color ?? null,
      actionMatrix: matrix(actionStyle?.transform ?? null),
      actionTransform: actionStyle?.transform ?? null,
      borderColor: style.borderTopColor,
      cardTransform: style.transform,
      documentX: bounds.x + window.scrollX,
      documentY: bounds.y + window.scrollY,
      focusWithin: element.matches(':focus-within'),
      height: bounds.height,
      imageMatrix: matrix(imageStyle?.transform ?? null),
      imageTransform: imageStyle?.transform ?? null,
      viewportX: bounds.x,
      viewportY: bounds.y,
      width: bounds.width,
    }
  })
}

test('renders the final home without simulated commerce', async ({ page }, testInfo) => {
  const browser = watchBrowserErrors(page)
  const isDesktop = testInfo.project.name.startsWith('desktop')
  const mode = projectMode(testInfo.project.name)
  const isConfigured = mode === 'configured'

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Muévete a tu manera.', exact: true })).toBeVisible()
  await expect(page.getByText(/cambios|devoluciones/i)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Descubrir ropa' }).first()).toBeVisible()
  await expect(page.locator('.collection-world-grid')).toBeVisible()
  await expect(page.locator('.collection-world-panel')).toHaveCount(2)
  for (const selector of ['#ropa', '#accesorios', '#preguntas']) {
    const section = page.locator(selector)
    await section.scrollIntoViewIfNeeded()
    await expect(section).toBeVisible()
  }
  await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeVisible()
  await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  await expectHealthyPage(page)

  if (isConfigured) {
    await expect(page.getByRole('heading', { name: 'Encuentra tu movimiento.', exact: true })).toBeVisible()
    const accessoryFilters = page.getByRole('navigation', { name: 'Explorar accesorios por etiqueta' })
    await expect(accessoryFilters.getByRole('link')).toHaveText(['Botellas', 'Gym', 'Organización', 'Regalos'])
  }

  const current = page.locator('[data-current]')
  await expect(current).toBeVisible()
  const heroRailFlow = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('.hero-journey')
    const rail = document.querySelector<HTMLElement>('[data-current]')
    if (!hero || !rail) return null
    const heroBounds = hero.getBoundingClientRect()
    const railBounds = rail.getBoundingClientRect()
    return {
      heroBottom: heroBounds.bottom + window.scrollY,
      railTop: railBounds.top + window.scrollY,
      railFollowsHero: Boolean(hero.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING),
    }
  })
  expect(heroRailFlow).not.toBeNull()
  expect(heroRailFlow?.railFollowsHero).toBe(true)
  expect(heroRailFlow?.heroBottom ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual((heroRailFlow?.railTop ?? 0) + 1)
  await current.scrollIntoViewIfNeeded()
  await expect(current).toBeInViewport()
  await expectNoOverlap(page, ['.hero-section', '[data-current]'])
  await scrollInstantly(page, 0)

  const mobileHeader = !isDesktop
  await expectNoOverlap(page, mobileHeader
    ? ['.menu-button', '.wordmark', '.cart-link']
    : ['.wordmark', '.site-nav', '.cart-link'])

  await page.keyboard.press('Tab')
  const focusStyle = await page.locator(':focus-visible').evaluate((element) => {
    const style = getComputedStyle(element)
    return { width: style.outlineWidth, style: style.outlineStyle }
  })
  expect(focusStyle.style).not.toBe('none')
  expect(Number.parseFloat(focusStyle.width)).toBeGreaterThan(0)

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await expect(page.locator(':focus-visible')).toHaveCount(0)
  await revealFullPage(page)

  const worldPanels = page.locator('.collection-world-panel')
  const worldBoxes = await Promise.all([worldPanels.nth(0).boundingBox(), worldPanels.nth(1).boundingBox()])
  const worldGridLayout = await page.locator('.collection-world-grid').evaluate((element) => {
    const rail = element as HTMLElement
    const style = getComputedStyle(rail)
    return {
      clientWidth: rail.clientWidth,
      scrollWidth: rail.scrollWidth,
      display: style.display,
      overflowX: style.overflowX,
      scrollSnapType: style.scrollSnapType,
    }
  })
  expect(worldBoxes.every(Boolean)).toBe(true)
  const [firstWorld, secondWorld] = worldBoxes
  if (isConfigured && isDesktop && firstWorld && secondWorld) {
    expect(worldGridLayout.display).toBe('grid')
    expect(Math.abs(firstWorld.y - secondWorld.y)).toBeLessThanOrEqual(1)
    expect(firstWorld.x + firstWorld.width).toBeLessThanOrEqual(secondWorld.x + 1)
  } else if (isConfigured && !isDesktop && firstWorld && secondWorld) {
    const worldGridBox = await page.locator('.collection-world-grid').boundingBox()
    expect(worldGridBox).not.toBeNull()
    expect(worldGridLayout.display).toBe('flex')
    expect(Math.abs(firstWorld.y - secondWorld.y)).toBeLessThanOrEqual(1)
    expect(firstWorld.x + firstWorld.width).toBeLessThanOrEqual(secondWorld.x + 1)
    if (worldGridBox) {
      expect(firstWorld.x).toBeGreaterThanOrEqual(worldGridBox.x - 1)
      expect(secondWorld.x).toBeLessThan(worldGridBox.x + worldGridBox.width)
    }
    expect(worldGridLayout.scrollWidth).toBeGreaterThan(worldGridLayout.clientWidth)
    expect(['auto', 'scroll']).toContain(worldGridLayout.overflowX)
    expect(worldGridLayout.scrollSnapType).toContain('mandatory')
  }

  const worldRadii = await page.locator('.collection-world-media').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element)
    return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius]
      .map((radius) => Number.parseFloat(radius))
  }))
  expect(worldRadii).toHaveLength(2)
  for (const radii of worldRadii) {
    expect(radii.every((radius) => Number.isFinite(radius) && radius <= 24)).toBe(true)
  }

  await expect.poll(() => inspectImages(page, '.collection-world-media img')).toEqual([
    expect.objectContaining({
      complete: true,
      source: '/editorial/collection-ropa.webp',
      error: '',
    }),
    expect.objectContaining({
      complete: true,
      source: '/editorial/collection-accesorios.webp',
      error: '',
    }),
  ])
  const worldImages = await inspectImages(page, '.collection-world-media img')
  for (const image of worldImages) {
    expect(image.naturalWidth).toBeGreaterThan(0)
    expect(image.naturalHeight).toBeGreaterThan(0)
    expect(image.opaquePixels).toBeGreaterThan(0)
    expect(image.channelRange).toBeGreaterThan(8)
  }

  const revealedSecondPanelDelay = await worldPanels.nth(1).evaluate((element) => getComputedStyle(element).transitionDelay)
  expect(longestDurationSeconds(revealedSecondPanelDelay)).toBe(0)

  await expectNoHorizontalClipping(page, [
    '.hero-content',
    '.current-rail',
    '.current-rail p',
    '.collection-world-heading',
    '.collection-world-copy',
    '.commerce-state-copy',
    '.collection-section-intro',
    '.collection-empty',
    '.editorial-story-copy',
    '.trust-faq-heading',
    '.trust-faq-list summary',
    '.footer-top',
  ])

  if (isConfigured) {
    const ropaSection = page.locator('#ropa')
    await expect(ropaSection.locator('.product-card')).toHaveCount(0)
    await expect(ropaSection.getByRole('heading', { name: 'Estamos preparando esta selección.' })).toBeVisible()

    const accessoryCards = page.locator('#accesorios .collection-product-card')
    await expect(accessoryCards).toHaveCount(3)
    for (let index = 0; index < 3; index += 1) {
      await expect(accessoryCards.nth(index)).not.toHaveClass(/\bcollection-product-card-featured\b/)
    }
    await expect(accessoryCards.locator('.product-copy h3')).toHaveText([
      'Accesorio Fyther Uno',
      'Accesorio Fyther Dos',
      'Accesorio Fyther Tres',
    ])

    const productImages = await inspectImages(page, '#accesorios .product-card img')
    expect(productImages.map(({ source }) => source)).toEqual(['/ropa.png', '/modelo2.png', '/home.jpeg'])
    expect(productImages.some(({ source }) => /collection-(?:ropa|accesorios)\.webp$/.test(source))).toBe(false)
    expect(productImages.every(({ complete, naturalWidth, naturalHeight }) => complete && naturalWidth > 0 && naturalHeight > 0)).toBe(true)

    const productMedia = await accessoryCards.locator('.product-media').evaluateAll((elements) => elements.map((element) => {
      const bounds = element.getBoundingClientRect()
      return bounds.width / bounds.height
    }))
    expect(productMedia).toHaveLength(3)
    for (const renderedRatio of productMedia) {
      expect(renderedRatio).toBeGreaterThan(0.78)
      expect(renderedRatio).toBeLessThan(0.82)
    }

    const firstProductCard = accessoryCards.nth(0).locator('.product-card')
    const firstProductAction = firstProductCard.locator('.product-action')
    const baselineCard = await firstProductCard.evaluate((element) => {
      const style = getComputedStyle(element)
      const bounds = element.getBoundingClientRect()
      return {
        borderColor: style.borderTopColor,
        documentX: bounds.x + window.scrollX,
        documentY: bounds.y + window.scrollY,
        width: bounds.width,
        height: bounds.height,
      }
    })

    await focusByKeyboard(page, '#accesorios .product-card')
    await expect(firstProductCard).toBeFocused()
    expect(await firstProductCard.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
    await expect.poll(() => firstProductCard.evaluate((element) => getComputedStyle(element).borderTopColor)).toBe('rgb(240, 108, 203)')
    await expect.poll(() => firstProductAction.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(110, 239, 242)')
    await expect.poll(async () => {
      const state = await readProductCardInteraction(firstProductCard)
      return Math.abs((state.imageMatrix?.a ?? 0) - 1.025) <= 0.001
        && Math.abs((state.actionMatrix?.e ?? 0) - 4.8) <= 0.15
    }).toBe(true)

    const focusedMotion = await readProductCardInteraction(firstProductCard)
    expect(focusedMotion.imageMatrix).not.toBeNull()
    expect(Math.abs((focusedMotion.imageMatrix?.a ?? 0) - 1.025)).toBeLessThanOrEqual(0.001)
    expect(Math.abs((focusedMotion.imageMatrix?.d ?? 0) - 1.025)).toBeLessThanOrEqual(0.001)
    expect(Math.abs(focusedMotion.imageMatrix?.b ?? 0)).toBeLessThanOrEqual(0.001)
    expect(Math.abs(focusedMotion.imageMatrix?.c ?? 0)).toBeLessThanOrEqual(0.001)
    expect(focusedMotion.actionMatrix).not.toBeNull()
    expect(Math.abs((focusedMotion.actionMatrix?.e ?? 0) - 4.8)).toBeLessThanOrEqual(0.15)
    expect(Math.abs(focusedMotion.actionMatrix?.f ?? 0)).toBeLessThanOrEqual(0.001)

    const focusedCard = await firstProductCard.evaluate((element) => {
      const cardStyle = getComputedStyle(element)
      const action = element.querySelector('.product-action')
      const actionStyle = action ? getComputedStyle(action) : null
      const bounds = element.getBoundingClientRect()
      return {
        borderColor: cardStyle.borderTopColor,
        actionColor: actionStyle?.color ?? null,
        outlineStyle: cardStyle.outlineStyle,
        outlineWidth: cardStyle.outlineWidth,
        documentX: bounds.x + window.scrollX,
        documentY: bounds.y + window.scrollY,
        width: bounds.width,
        height: bounds.height,
      }
    })
    expect(focusedCard.borderColor).not.toBe(baselineCard.borderColor)
    expect(focusedCard.actionColor).toBe('rgb(110, 239, 242)')
    expect(focusedCard.outlineStyle).not.toBe('none')
    expect(Number.parseFloat(focusedCard.outlineWidth ?? '0')).toBeGreaterThan(0)
    expect(Math.abs(focusedCard.width - baselineCard.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(focusedCard.height - baselineCard.height)).toBeLessThanOrEqual(1)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await revealFullPage(page)

    const configuredSections = [
      '.hero-section',
      '.current-rail',
      '.collection-worlds',
      '#ropa.collection-section',
      '.editorial-story',
      '#accesorios.collection-section',
      '#preguntas',
      '.site-footer',
    ]
    await expectVerticalOrder(page, configuredSections)
    await expectNoOverlap(page, configuredSections)
    await expectHealthyPage(page)
  }

  await expectTextContained(page, '.current-list li')

  await expectFooterMarkContained(page)
  const screenshotName = isConfigured
    ? `home-configured-${testInfo.project.name.replace('-configured', '')}.png`
    : `home-v02-${testInfo.project.name}.png`
  await stabilizeForScreenshot(page)
  await page.screenshot({ path: testInfo.outputPath(screenshotName), fullPage: true })
  browser.expectClean()
})

test('categories, products, FAQ, and footer work without JavaScript', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-no-js-configured', 'No-JavaScript contract has a dedicated project')

  await page.goto('/')
  await expect(page.locator('html')).not.toHaveAttribute('data-reveal-enhanced', 'true')
  await expect(page.locator('.collection-world-panel')).toHaveCount(2)
  await expect(page.locator('.collection-world-panel').first()).toBeVisible()
  await expect(page.locator('#accesorios .product-card')).toHaveCount(3)
  await expect(page.locator('#accesorios .product-card').first()).toBeVisible()
  await expect(page.locator('#preguntas')).toBeVisible()

  const firstQuestion = page.locator('#preguntas summary').first()
  await expect(firstQuestion).toBeVisible()
  await firstQuestion.click()
  await expect(page.locator('#preguntas details').first()).toHaveAttribute('open', '')
  await expect(page.getByText('Sí. Todos nuestros productos son originales y de marcas reconocidas.')).toBeVisible()
  await expect(page.locator('.site-footer')).toBeVisible()
  await expect(page.locator('.site-footer').getByRole('link', { name: 'Términos' })).toHaveAttribute('href', '/terminos')
  const revealStyles = await page.locator('[data-reveal]').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element)
    return { opacity: style.opacity, pointerEvents: style.pointerEvents, visibility: style.visibility }
  }))
  expect(revealStyles.length).toBeGreaterThan(0)
  expect(revealStyles.every((style) => style.opacity === '1'
    && style.visibility === 'visible'
    && style.pointerEvents !== 'none')).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('home-no-javascript.png'), fullPage: true })
})

test('scrubs the hero once across its own journey travel without rewinding', async ({ page }, testInfo) => {
  test.skip(projectMode(testInfo.project.name) !== 'configured', 'Hero scrub runs once per configured viewport')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  const hero = page.locator('.hero-journey')
  const video = page.locator('.hero-media video')
  await expect(hero).toHaveAttribute('data-hero-complete', 'false')
  await expect(video).toHaveCount(1)
  await expect(video).not.toHaveAttribute('loop', '')
  expect(await video.evaluate((media) => (media as HTMLVideoElement).loop)).toBe(false)

  await expect.poll(() => video.evaluate((media) => {
    const element = media as HTMLVideoElement
    return element.readyState >= HTMLMediaElement.HAVE_METADATA
      && Number.isFinite(element.duration)
      && element.duration > 1
      && element.videoWidth > 0
      && element.videoHeight > 0
  }), { timeout: 15_000 }).toBe(true)

  const metadata = await video.evaluate((media) => {
    const element = media as HTMLVideoElement
    return {
      duration: element.duration,
      height: element.videoHeight,
      width: element.videoWidth,
    }
  })
  expect(metadata.width).toBeGreaterThan(0)
  expect(metadata.height).toBeGreaterThan(0)

  const startFrame = await settleAndSampleVideoFrame(video)
  expect(startFrame.opaqueSamples).toBe(startFrame.luminances.length)
  expect(startFrame.meanLuminance).toBeGreaterThan(8)
  expect(startFrame.luminanceVariance).toBeGreaterThan(40)

  await page.screenshot({ path: testInfo.outputPath(`hero-start-${testInfo.project.name}.png`) })
  const journey = await hero.evaluate((element) => {
    const journeyElement = element as HTMLElement
    const scene = journeyElement.querySelector<HTMLElement>('.hero-section')
    if (!scene) throw new Error('Hero scene is missing')
    const bounds = journeyElement.getBoundingClientRect()
    return {
      start: bounds.top + window.scrollY,
      travel: journeyElement.offsetHeight - scene.offsetHeight,
    }
  })
  expect(journey.travel).toBeGreaterThan(0)

  if (testInfo.project.name === 'mobile-configured') {
    const viewportHeight = page.viewportSize()?.height ?? 0
    expect(journey.travel / viewportHeight).toBeGreaterThan(0.32)
    expect(journey.travel / viewportHeight).toBeLessThan(0.4)
    await scrollInstantly(page, journey.start + journey.travel * 0.6)
    await expect(hero).toHaveAttribute('data-hero-complete', 'false')
    await expect.poll(() => hero.evaluate((element) => {
      const progress = Number.parseFloat((element as HTMLElement).style.getPropertyValue('--hero-progress'))
      return progress > 0.55 && progress < 0.65
    })).toBe(true)
  }

  await scrollInstantly(page, journey.start + journey.travel)
  await expect(hero).toHaveAttribute('data-hero-complete', 'true')
  const finalFrame = await settleAndSampleVideoFrame(video)
  expect(finalFrame.opaqueSamples).toBe(finalFrame.luminances.length)
  expect(finalFrame.meanLuminance).toBeGreaterThan(8)
  expect(finalFrame.luminanceVariance).toBeGreaterThan(40)
  expect(finalFrame.luminances).toHaveLength(startFrame.luminances.length)
  const frameDifference = finalFrame.luminances.reduce((total, luminance, index) => (
    total + Math.abs(luminance - startFrame.luminances[index])
  ), 0) / finalFrame.luminances.length
  expect(frameDifference).toBeGreaterThan(12)

  const finalTime = await video.evaluate((media) => (media as HTMLVideoElement).currentTime)
  expect(Math.abs(finalTime - (metadata.duration - 1))).toBeLessThanOrEqual(0.15)
  expect(await video.evaluate((media) => (media as HTMLVideoElement).ended)).toBe(false)
  await page.screenshot({ path: testInfo.outputPath(`hero-final-${testInfo.project.name}.png`) })

  await scrollInstantly(page, journey.start + journey.travel / 2)
  await expect.poll(() => video.evaluate((media) => (media as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(finalTime - 0.02)
  await expect(hero).toHaveAttribute('data-hero-complete', 'true')
  await expectHealthyPage(page)
  browser.expectClean()
})

test('covers product card hover feedback on fine pointers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-configured', 'Fine-pointer hover runs only in desktop-configured')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  const card = page.locator('#accesorios .product-card').first()
  await card.scrollIntoViewIfNeeded()
  await expect(card).toBeVisible()
  expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(true)

  await card.hover()
  await page.mouse.move(1, 1)
  await expect.poll(async () => {
    const state = await readProductCardInteraction(card)
    return state.borderColor === 'rgba(234, 251, 251, 0.16)'
      && state.actionColor === 'rgb(234, 251, 251)'
      && state.imageTransform === 'none'
      && state.actionTransform === 'none'
  }).toBe(true)
  await card.evaluate((element) => {
    const root = document.documentElement
    const previousBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    element.scrollIntoView({ block: 'center' })
    root.style.scrollBehavior = previousBehavior
  })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

  let previousGeometry: Awaited<ReturnType<typeof readProductCardInteraction>> | null = null
  let stableGeometrySamples = 0
  await expect.poll(async () => {
    const current = await readProductCardInteraction(card)
    const stable = previousGeometry !== null
      && Math.abs(current.viewportX - previousGeometry.viewportX) <= 0.1
      && Math.abs(current.viewportY - previousGeometry.viewportY) <= 0.1
      && Math.abs(current.documentX - previousGeometry.documentX) <= 0.1
      && Math.abs(current.documentY - previousGeometry.documentY) <= 0.1
      && Math.abs(current.width - previousGeometry.width) <= 0.1
      && Math.abs(current.height - previousGeometry.height) <= 0.1
    stableGeometrySamples = stable ? stableGeometrySamples + 1 : 0
    previousGeometry = current
    return stableGeometrySamples >= 2
  }, { intervals: [100], timeout: 5_000 }).toBe(true)

  const baseline = await readProductCardInteraction(card)
  expect(baseline.focusWithin).toBe(false)
  expect(baseline.cardTransform).toBe('none')
  expect(baseline.imageTransform).toBe('none')
  expect(baseline.actionTransform).toBe('none')

  await card.hover()
  await expect.poll(async () => {
    const state = await readProductCardInteraction(card)
    return state.borderColor === 'rgb(240, 108, 203)'
      && state.actionColor === 'rgb(110, 239, 242)'
      && Math.abs((state.imageMatrix?.a ?? 0) - 1.025) <= 0.001
      && Math.abs((state.actionMatrix?.e ?? 0) - 4.8) <= 0.15
  }).toBe(true)

  const hovered = await readProductCardInteraction(card)
  expect(hovered.borderColor).not.toBe(baseline.borderColor)
  expect(hovered.actionColor).not.toBe(baseline.actionColor)
  expect(hovered.actionColor).toBe('rgb(110, 239, 242)')
  expect(hovered.imageTransform).not.toBe('none')
  expect(hovered.imageMatrix).not.toBeNull()
  expect(Math.abs((hovered.imageMatrix?.a ?? 0) - 1.025)).toBeLessThanOrEqual(0.001)
  expect(Math.abs((hovered.imageMatrix?.d ?? 0) - 1.025)).toBeLessThanOrEqual(0.001)
  expect(Math.abs(hovered.imageMatrix?.b ?? 0)).toBeLessThanOrEqual(0.001)
  expect(Math.abs(hovered.imageMatrix?.c ?? 0)).toBeLessThanOrEqual(0.001)
  expect(hovered.actionTransform).not.toBe('none')
  expect(hovered.actionMatrix).not.toBeNull()
  expect(Math.abs((hovered.actionMatrix?.e ?? 0) - 4.8)).toBeLessThanOrEqual(0.15)
  expect(Math.abs(hovered.actionMatrix?.f ?? 0)).toBeLessThanOrEqual(0.001)
  expect(Math.abs(hovered.viewportX - baseline.viewportX)).toBeLessThanOrEqual(1)
  expect(Math.abs(hovered.viewportY - baseline.viewportY)).toBeLessThanOrEqual(1)
  expect(Math.abs(hovered.documentX - baseline.documentX)).toBeLessThanOrEqual(1)
  expect(Math.abs(hovered.documentY - baseline.documentY)).toBeLessThanOrEqual(1)
  expect(Math.abs(hovered.width - baseline.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(hovered.height - baseline.height)).toBeLessThanOrEqual(1)

  await page.mouse.move(1, 1)
  await expect.poll(async () => {
    const state = await readProductCardInteraction(card)
    return state.borderColor === baseline.borderColor
      && state.actionColor === baseline.actionColor
      && state.imageTransform === 'none'
      && state.actionTransform === 'none'
  }).toBe(true)

  await focusByKeyboard(page, '#accesorios .product-card')
  await expect(card).toBeFocused()
  expect(await card.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  await expect.poll(async () => {
    const state = await readProductCardInteraction(card)
    return state.borderColor === hovered.borderColor
      && state.actionColor === hovered.actionColor
      && Math.abs((state.imageMatrix?.a ?? 0) - (hovered.imageMatrix?.a ?? 0)) <= 0.001
      && Math.abs((state.actionMatrix?.e ?? 0) - (hovered.actionMatrix?.e ?? 0)) <= 0.15
  }).toBe(true)
  const focused = await readProductCardInteraction(card)
  expect(focused.borderColor).toBe(hovered.borderColor)
  expect(focused.actionColor).toBe(hovered.actionColor)
  expect(Math.abs((focused.imageMatrix?.a ?? 0) - (hovered.imageMatrix?.a ?? 0))).toBeLessThanOrEqual(0.001)
  expect(Math.abs((focused.imageMatrix?.d ?? 0) - (hovered.imageMatrix?.d ?? 0))).toBeLessThanOrEqual(0.001)
  expect(Math.abs((focused.actionMatrix?.e ?? 0) - (hovered.actionMatrix?.e ?? 0))).toBeLessThanOrEqual(0.15)
  expect(Math.abs((focused.actionMatrix?.f ?? 0) - (hovered.actionMatrix?.f ?? 0))).toBeLessThanOrEqual(0.001)
  expect(Math.abs(focused.documentX - baseline.documentX)).toBeLessThanOrEqual(1)
  expect(Math.abs(focused.documentY - baseline.documentY)).toBeLessThanOrEqual(1)
  expect(Math.abs(focused.width - baseline.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(focused.height - baseline.height)).toBeLessThanOrEqual(1)
  browser.expectClean()
})

test('covers product card baseline on configured touch viewports', async ({ page }, testInfo) => {
  test.skip(!['tablet-configured', 'mobile-configured'].includes(testInfo.project.name), 'Touch baseline runs only in configured touch projects')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  const card = page.locator('#accesorios .product-card').first()
  await card.scrollIntoViewIfNeeded()
  await expect(card).toBeVisible()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

  expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false)
  const baseline = await readProductCardInteraction(card)
  expect(baseline.focusWithin).toBe(false)
  expect(baseline.cardTransform).toBe('none')
  expect(baseline.borderColor).toBe('rgba(234, 251, 251, 0.16)')
  expect(baseline.imageTransform).toBe('none')
  expect(baseline.imageMatrix).toBeNull()
  expect(baseline.actionTransform).toBe('none')
  expect(baseline.actionMatrix).toBeNull()
  expect(baseline.actionColor).toBe('rgb(234, 251, 251)')
  browser.expectClean()
})

test('opens a fixture accessory tag as an isolated catalog filter', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-configured', 'The fixture filter flow needs one configured viewport')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  const filters = page.getByRole('navigation', { name: 'Explorar accesorios por etiqueta' })
  const filterLinks = filters.getByRole('link')
  await expect(filterLinks).toHaveText(['Botellas', 'Gym', 'Organización', 'Regalos'])

  await Promise.all([
    page.waitForURL((url) => url.pathname === '/catalogo'
      && url.searchParams.get('categoria') === 'Accesorios'
      && url.searchParams.get('buscar') === 'Botellas', { timeout: backendTimeout }),
    filterLinks.first().click(),
  ])

  await expect(page.locator('.catalog-loading')).toHaveCount(0, { timeout: backendTimeout })
  await expect(page.getByRole('button', { name: 'Accesorios', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('Botellas')
  const matchingProducts = page.locator('.catalog-grid .product-card h3')
  await expect(matchingProducts).toHaveCount(1)
  await expect(matchingProducts).toHaveText(['Accesorio Fyther Uno'])
  await expect(page.getByText('Accesorio Fyther Dos', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Accesorio Fyther Tres', { exact: true })).toHaveCount(0)
  await expectHealthyPage(page)
  browser.expectClean()
})

test('mobile and tablet menu closes with Escape and returns focus', async ({ page }, testInfo) => {
  const isDesktop = testInfo.project.name.startsWith('desktop')
  const isConfigured = projectMode(testInfo.project.name) === 'configured'
  test.skip(isDesktop || !isConfigured, 'The mobile menu runs only in tablet-configured and mobile-configured')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  const trigger = page.locator('.menu-button')
  await expect(trigger).toBeVisible()
  await expect(trigger).toHaveAccessibleName('Abrir menú')
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()
  browser.expectClean()

  await trigger.click()
  await Promise.all([
    page.waitForURL(/\/catalogo\?categoria=Ropa$/, { timeout: backendTimeout }),
    page.locator('#primary-navigation').getByRole('link', { name: 'Ropa', exact: true }).click(),
  ])

  await expect(page.locator('.catalog-loading')).toHaveCount(0, { timeout: backendTimeout })
  const visibleH1 = page.getByRole('heading', { level: 1, name: 'Encuentra algo para ti.' })
  const ropaFilter = page.getByRole('button', { name: 'Ropa', exact: true })
  await expect(visibleH1).toBeVisible({ timeout: backendTimeout })
  await expect(ropaFilter).toBeVisible({ timeout: backendTimeout })
  await expect(ropaFilter).toHaveAttribute('aria-pressed', 'true', { timeout: backendTimeout })
  await expect(page.locator('h1:visible')).toHaveCount(1)
  await expectHealthyPage(page)
  browser.expectClean()
})

test('supports a continuous keyboard path through the mobile storefront', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-configured', 'Full mobile keyboard path runs once')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  const menuButton = page.locator('.menu-button')
  const headerTraversal = createFocusTraversal()
  await tabTo(page, menuButton, headerTraversal)
  await page.keyboard.press('Enter')
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

  const mobileNav = page.locator('#primary-navigation')
  for (const name of ['Ropa', 'Accesorios', 'Seguir pedido']) {
    const link = mobileNav.getByRole('link', { name, exact: true })
    await tabTo(page, link, headerTraversal)
    await expect(link).toBeFocused()
  }
  await page.keyboard.press('Escape')
  await expect(menuButton).toBeFocused()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

  const storefrontTraversal = createFocusTraversal()
  const progression: Array<{ label: string, order: number }> = []
  for (const { label, target } of [
    { label: '', target: page.locator('.cart-link') },
    { label: '', target: page.getByRole('link', { name: 'Descubrir ropa' }).first() },
    { label: '', target: page.getByRole('link', { name: 'Ver accesorios' }).first() },
    { label: 'category', target: page.locator('.collection-world-panel').nth(0) },
    { label: 'category', target: page.locator('.collection-world-panel').nth(1) },
    { label: 'product', target: page.locator('#accesorios .product-card').nth(0) },
    { label: 'product', target: page.locator('#accesorios .product-card').nth(2) },
    { label: 'FAQ', target: page.locator('#preguntas summary').first() },
    { label: 'footer', target: page.locator('.site-footer .footer-links a').first() },
  ]) {
    await tabTo(page, target, storefrontTraversal)
    await expect(target).toBeFocused()
    if (label) {
      progression.push({
        label,
        order: await target.evaluate((element) => [...document.querySelectorAll('*')].indexOf(element)),
      })
    }
  }

  expect(progression.map(({ label }) => label)).toEqual(['category', 'category', 'product', 'product', 'FAQ', 'footer'])
  for (let index = 1; index < progression.length; index += 1) {
    expect(progression[index].order).toBeGreaterThan(progression[index - 1].order)
  }
  await expect(tabTo(page, menuButton, storefrontTraversal)).rejects.toThrow(/focus traversal wrapped/i)

  await expectHealthyPage(page)
  browser.expectClean()
})

test('renders final trust pages without internal language', async ({ page }) => {
  const browser = watchBrowserErrors(page)

  for (const route of ['/privacidad', '/terminos', '/envios-apartados']) {
    await page.goto(route)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(/cambios|devoluciones/i)
    await expectHealthyPage(page)
    browser.expectClean()
  }

  await page.goto('/envios-cambios')
  await expect(page).toHaveURL(/\/envios-apartados$/)
  await expect(page.getByRole('heading', { name: 'Envíos y apartados, con claridad.' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/cambios|devoluciones/i)
  await expectHealthyPage(page)
  browser.expectClean()
})

test('keeps catalog, cart, and checkout truthful across harness states', async ({ page }, testInfo) => {
  const browser = watchBrowserErrors(page)
  const mode = projectMode(testInfo.project.name)
  const isConfigured = mode === 'configured'

  await page.goto('/catalogo')
  await expect(page.locator('.catalog-loading')).toHaveCount(0, { timeout: backendTimeout })
  const catalogH1 = page.locator('h1:visible')
  await expect(catalogH1).toHaveCount(1)
  await expect(catalogH1).toBeVisible()
  await expect(page.getByText(exposedConfiguration)).toHaveCount(0)
  await expectHealthyPage(page)

  if (isConfigured) {
    await expect(catalogH1).toHaveText('Encuentra algo para ti.', { timeout: backendTimeout })
    await expect(page.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: backendTimeout })

    await page.goto('/catalogo/accesorio-fyther-uno')
    await expect(page.getByRole('heading', { level: 1, name: 'Accesorio Fyther Uno' })).toBeVisible({ timeout: backendTimeout })
    await page.getByRole('button', { name: 'Agregar al carrito' }).click()
    await expect(page.getByRole('status')).toHaveText('Agregado al carrito')
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { level: 1, name: 'Terminemos juntas.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.locator('.checkout-summary')).toContainText('1 × Accesorio Fyther Uno')
    await expect(page.getByRole('radio', { name: /Efectivo/ })).toBeChecked()
    await expect(page.getByRole('button', { name: /Confirmar pedido/ })).toBeEnabled()
  } else {
    expect(mode).toBe('unconfigured')
    await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  }
  browser.expectClean()

  await page.goto('/carrito')
  if (isConfigured) {
    await expect(page.getByRole('heading', { level: 1, name: 'Lo que elegiste.' })).toBeVisible()
    await expect(page.locator('.cart-line')).toContainText('Accesorio Fyther Uno')
  } else {
    await expect(page.getByRole('heading', { name: 'Tu selección empieza aquí.' })).toBeVisible()
  }
  await expectHealthyPage(page)
  browser.expectClean()

  await page.goto('/checkout')
  if (isConfigured) {
    await expect(page.getByRole('heading', { level: 1, name: 'Terminemos juntas.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.locator('.checkout-summary')).toContainText('1 × Accesorio Fyther Uno')
    await expect(page.getByRole('button', { name: /Confirmar pedido/ })).toBeEnabled()
  } else {
    await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  }
  await expect(page.getByText(exposedConfiguration)).toHaveCount(0)
  await expectHealthyPage(page)
  browser.expectClean()

  const trackingPage = await page.context().newPage()
  const trackingResponse = await trackingPage.goto('/tracking/no-es-un-pedido')
  expect(trackingResponse?.status()).toBe(404)
  await expect(trackingPage.getByText('No encontramos esta página.')).toBeVisible()
  await expect(trackingPage.locator('body')).not.toContainText(exposedConfiguration)
  await expectHealthyPage(trackingPage)
  await trackingPage.close()
  browser.expectClean()
})

test('completes configured variant checkout through confirmation and tracking', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-configured', 'Successful checkout runs once in the guarded development fixture')
  const browser = watchBrowserErrors(page)

  await page.goto('/catalogo/accesorio-fyther-uno')
  await expect(page.getByRole('heading', { level: 1, name: 'Accesorio Fyther Uno' })).toBeVisible()
  await page.getByRole('button', { name: 'Cian' }).click()
  await expect(page.getByRole('button', { name: 'Cian' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('2 disponibles')).toBeVisible()
  await page.getByRole('button', { name: 'Agregar al carrito' }).click()
  await expect(page.getByRole('status')).toHaveText('Agregado al carrito')

  await page.goto('/checkout')
  await expect(page.locator('.checkout-summary')).toContainText('1 × Accesorio Fyther Uno, Cian')
  await page.getByRole('textbox', { name: 'Nombre completo' }).fill('Ana Prueba')
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('ana@example.com')
  await page.getByRole('textbox', { name: 'Dirección exacta' }).fill('Barrio Escalante')
  await expect(page.getByRole('radio', { name: /Efectivo/ })).toBeChecked()
  await page.getByRole('button', { name: /Confirmar pedido/ }).click()

  await expect(page).toHaveURL(/\/confirmacion\/40000000-0000-4000-8000-000000000001$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido confirmado.' })).toBeVisible()
  await expect(page.getByText('FY-E2E-0001')).toBeVisible()
  await expect(page.locator('.order-summary')).toContainText('1 x Accesorio Fyther Uno - Cian')
  const trackingLink = page.locator('.confirmation-lead').getByRole('link', { name: 'Seguir pedido' })
  await expect(trackingLink).toHaveAttribute('href', '/tracking/40000000-0000-4000-8000-000000000001')
  await page.screenshot({ path: testInfo.outputPath('checkout-confirmation.png'), fullPage: true })

  await trackingLink.click()
  await expect(page).toHaveURL(/\/tracking\/40000000-0000-4000-8000-000000000001$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Tu pedido sigue su camino.' })).toBeVisible()
  await expect(page.locator('.tracking-head')).toContainText('Pedido recibido')
  await expect(page.getByRole('heading', { level: 2, name: 'Historial' })).toBeVisible()
  await expect(page.locator('.tracking-events')).toContainText('Recibimos tu pedido y ya estamos preparándolo.')
  await expect(page.getByRole('link', { name: 'Volver a la colección' })).toHaveAttribute('href', '/catalogo')
  await page.screenshot({ path: testInfo.outputPath('order-tracking.png'), fullPage: true })
  await expectHealthyPage(page)
  browser.expectClean()
})

test('keeps every service ribbon phrase visible at 200% mobile text size', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-configured', 'Text resizing runs only in mobile-configured')
  const browser = watchBrowserErrors(page)

  await page.goto('/')
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  await revealFullPage(page)

  const rail = page.locator('.current-rail')
  await expect(rail).toBeVisible()
  await expect(rail).toContainText('ORIGINALES · CORREOS DE COSTA RICA · APARTADOS · RESPUESTA EN MENOS DE 24H')
  await expectNoHorizontalClipping(page, [
    '.current-rail',
    '.current-list',
    '.collection-world-heading',
    '.collection-world-description',
    '.collection-world-copy',
    '.collection-world-filters a',
    '.collection-section-intro',
    '.collection-section-description',
    '#accesorios .product-copy',
    '#accesorios .product-copy h3',
    '.collection-section-link',
    '.trust-faq-heading',
    '.trust-faq-question',
    '.footer-top',
  ])
  await expectTextContained(page, [
    '.current-list li',
    '.collection-world-description',
    '.collection-world-name',
    '.collection-section-description',
    '#accesorios .product-copy h3',
  ].join(', '))
  await expectHealthyPage(page)
  browser.expectClean()
})

test('uses the static poster and omits video when data saver is enabled', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-configured', 'Data saver fallback runs once')
  const browser = watchBrowserErrors(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: true,
        addEventListener() {},
        removeEventListener() {},
      },
    })
  })

  await page.goto('/')
  await expect(page.locator('.hero-journey')).toHaveAttribute('data-hero-static', 'true')
  await expect(page.locator('.hero-media video')).toHaveCount(0)
  const poster = (await inspectImages(page, '.hero-poster-desktop'))[0]
  expect(poster).toEqual(expect.objectContaining({ complete: true, error: '' }))
  expect(poster.naturalWidth).toBeGreaterThan(0)
  expect(poster.naturalHeight).toBeGreaterThan(0)
  await expectHealthyPage(page)
  browser.expectClean()
})

test('disables ambient motion when reduced motion is requested', async ({ page }, testInfo) => {
  const browser = watchBrowserErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Muévete a tu manera.', exact: true })).toBeVisible()

  const revealMotion = await page.locator('[data-reveal]').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element)
    return { animationDuration: style.animationDuration, transitionDuration: style.transitionDuration }
  }))
  for (const motion of revealMotion) {
    expect(longestDurationSeconds(motion.animationDuration)).toBeLessThanOrEqual(0.15)
    expect(longestDurationSeconds(motion.transitionDuration)).toBeLessThanOrEqual(0.15)
  }

  const videoStates = await page.locator('.hero-media video').evaluateAll((videos) => videos.map((video) => (video as HTMLVideoElement).paused))
  expect(videoStates.every(Boolean)).toBe(true)
  await expect(page.locator('.hero-media video')).toHaveCount(0)

  const currentMotion = await page.locator('.current-line > span').evaluate((element) => {
    const style = getComputedStyle(element)
    return { animation: style.animationName, transition: style.transitionDuration, transform: style.transform }
  })
  expect(currentMotion.animation).toBe('none')
  expect(longestDurationSeconds(currentMotion.transition)).toBeLessThanOrEqual(0.15)
  expect(currentMotion.transform).toBe('none')

  const spatialMotion = await page.locator([
    '.wordmark .brand-mark',
    '.collection-world-media img',
    '.collection-world-copy svg',
    '.trust-faq-list summary svg',
    '.trust-faq-answer',
  ].join(', ')).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element)
    return {
      animation: style.animationName,
      transition: style.transitionDuration,
      transform: style.transform,
      clipPath: style.clipPath,
    }
  }))
  expect(spatialMotion.length).toBeGreaterThan(0)
  for (const motion of spatialMotion) {
    expect(motion.animation).toBe('none')
    expect(longestDurationSeconds(motion.transition)).toBeLessThanOrEqual(0.15)
    expect(motion.transform).toBe('none')
    expect(['none', 'auto']).toContain(motion.clipPath)
  }

  const worldMotion = await page.locator('.collection-world-panel').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element)
    return {
      transform: style.transform,
      clipPath: style.clipPath,
      transitionDelay: style.transitionDelay,
    }
  }))
  expect(worldMotion).toHaveLength(2)
  for (const motion of worldMotion) {
    expect(motion.transform).toBe('none')
    expect(motion.clipPath).toBe('none')
  }
  expect(longestDurationSeconds(worldMotion[1].transitionDelay)).toBe(0)

  if (projectMode(testInfo.project.name) === 'configured') {
    const firstProductCard = page.locator('#accesorios .product-card').first()
    const firstProductAction = firstProductCard.locator('.product-action')
    const baselineFeedback = await firstProductCard.evaluate((element) => {
      const action = element.querySelector('.product-action')
      return {
        borderColor: getComputedStyle(element).borderTopColor,
        actionColor: action ? getComputedStyle(action).color : null,
      }
    })

    await focusByKeyboard(page, '#accesorios .product-card')
    await expect(firstProductCard).toBeFocused()
    expect(await firstProductCard.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
    await expect.poll(() => firstProductCard.evaluate((element) => getComputedStyle(element).borderTopColor)).toBe('rgb(240, 108, 203)')
    await expect.poll(() => firstProductAction.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(110, 239, 242)')

    const reducedFeedback = await firstProductCard.evaluate((element) => {
      const style = getComputedStyle(element)
      const action = element.querySelector('.product-action')
      const image = element.querySelector('.product-image')
      const actionStyle = action ? getComputedStyle(action) : null
      const imageStyle = image ? getComputedStyle(image) : null
      return {
        actionColor: actionStyle?.color ?? null,
        actionTransform: actionStyle?.transform ?? null,
        borderColor: style.borderTopColor,
        cardTransform: style.transform,
        cardTransitionDuration: style.transitionDuration,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        imageTransform: imageStyle?.transform ?? null,
        imageTransitionDuration: imageStyle?.transitionDuration ?? null,
        actionTransitionDuration: actionStyle?.transitionDuration ?? null,
      }
    })
    expect(reducedFeedback.actionColor).not.toBe(baselineFeedback.actionColor)
    expect(reducedFeedback.actionColor).toBe('rgb(110, 239, 242)')
    expect(reducedFeedback.borderColor).toBe('rgb(240, 108, 203)')
    expect(reducedFeedback.outlineStyle).not.toBe('none')
    expect(Number.parseFloat(reducedFeedback.outlineWidth)).toBeGreaterThan(0)
    expect(reducedFeedback.cardTransform).toBe('none')
    expect(reducedFeedback.actionTransform).toBe('none')
    expect(reducedFeedback.imageTransform).toBe('none')
    expect(longestDurationSeconds(reducedFeedback.cardTransitionDuration)).toBeLessThanOrEqual(0.12)
    expect(longestDurationSeconds(reducedFeedback.imageTransitionDuration ?? '')).toBeLessThanOrEqual(0.12)
    expect(longestDurationSeconds(reducedFeedback.actionTransitionDuration ?? '')).toBeLessThanOrEqual(0.12)

    const productMotion = await page.locator('#accesorios .collection-product-card').evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element)
      const image = element.querySelector('.product-image')
      return {
        transform: style.transform,
        imageTransform: image ? getComputedStyle(image).transform : null,
        transitionDelay: style.transitionDelay,
      }
    }))
    expect(productMotion).toHaveLength(3)
    for (const motion of productMotion) {
      expect(motion.transform).toBe('none')
      expect(motion.imageTransform).toBe('none')
      expect(longestDurationSeconds(motion.transitionDelay)).toBe(0)
    }
  }
  browser.expectClean()
})
