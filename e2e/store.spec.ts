import { expect, test, type Page, type Request } from '@playwright/test'

const forbiddenCommerceCopy = /modo demo|productos de demostraci[oó]n|simulaci[oó]n|Motion Tee|Training Layer|Daily Bag|Recovery Cap/i
const exposedConfiguration = /Supabase|service_role|\bkey\b|endpoint|\bdemo\b|simulaci/i
const frameworkDialog = '[data-nextjs-dialog]'
const backendTimeout = 15_000

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
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
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
    if (!visible || htmlElement.clientWidth === 0 || htmlElement.scrollWidth <= htmlElement.clientWidth + 1) return []
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
    const container = htmlElement.parentElement
    if (!container) return []
    const range = document.createRange()
    range.selectNodeContents(htmlElement)
    const textBounds = range.getBoundingClientRect()
    const elementBounds = htmlElement.getBoundingClientRect()
    const containerBounds = container.getBoundingClientRect()
    const style = getComputedStyle(htmlElement)
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
  await expect(reveals.first()).toHaveAttribute('data-reveal', 'on', { timeout: 10_000 })

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
    document.querySelectorAll<HTMLElement>('.collection-world-grid, .collection-world-filters')
      .forEach((rail) => { rail.scrollLeft = 0 })
    root.style.scrollBehavior = previousBehavior
  })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
  await expect.poll(() => page.locator('.collection-world-grid, .collection-world-filters').evaluateAll((rails) => (
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

    document.querySelectorAll<HTMLElement>('.collection-world-grid, .collection-world-filters')
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
      rails: [...document.querySelectorAll<HTMLElement>('.collection-world-grid, .collection-world-filters')]
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

  await expect.poll(() => page.locator('.collection-world-grid, .collection-world-filters').evaluateAll((rails) => (
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
  await expect(page.locator('#ropa')).toBeVisible()
  await expect(page.locator('#accesorios')).toBeVisible()
  await expect(page.locator('#preguntas')).toBeVisible()
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
  const currentBox = await current.boundingBox()
  expect(currentBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(testInfo.project.use.viewport?.height ?? 1000)

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
    expect(radii.every((radius) => Number.isFinite(radius) && radius <= 8)).toBe(true)
  }

  await expect.poll(() => inspectImages(page, '.collection-world-media img')).toEqual([
    expect.objectContaining({
      complete: true,
      source: '/collection-ropa.webp',
      error: '',
    }),
    expect.objectContaining({
      complete: true,
      source: '/collection-accesorios.webp',
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
    const accessoryCards = page.locator('#accesorios .collection-product-card')
    await expect(accessoryCards).toHaveCount(3)
    await expect(accessoryCards.nth(0)).toHaveClass(/\bcollection-product-card-featured\b/)
    await expect(accessoryCards.nth(1)).not.toHaveClass(/\bcollection-product-card-featured\b/)
    await expect(accessoryCards.nth(2)).not.toHaveClass(/\bcollection-product-card-featured\b/)
    await expect(accessoryCards.locator('.product-copy h3')).toHaveText([
      'Accesorio Fyther Uno',
      'Accesorio Fyther Dos',
      'Accesorio Fyther Tres',
    ])

    const productImages = await inspectImages(page, '#accesorios .product-card img')
    expect(productImages.map(({ source }) => source)).toEqual(['/ropa.png', '/modelo2.png', '/home.jpeg'])
    expect(productImages.some(({ source }) => /collection-(?:ropa|accesorios)\.webp$/.test(source))).toBe(false)
    expect(productImages.every(({ complete, naturalWidth, naturalHeight }) => complete && naturalWidth > 0 && naturalHeight > 0)).toBe(true)

    const featuredMedia = await accessoryCards.nth(0).locator('.product-media').boundingBox()
    expect(featuredMedia).not.toBeNull()
    if (featuredMedia) {
      const renderedRatio = featuredMedia.width / featuredMedia.height
      if (isDesktop) {
        expect(renderedRatio).toBeGreaterThan(1.55)
        expect(renderedRatio).toBeLessThan(1.65)
      } else {
        expect(renderedRatio).toBeGreaterThan(0.78)
        expect(renderedRatio).toBeLessThan(0.82)
      }
    }

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

  await expectTextContained(page, '.current-rail p')

  await expectFooterMarkContained(page)
  const screenshotName = isConfigured
    ? `home-configured-${testInfo.project.name.replace('-configured', '')}.png`
    : `home-v02-${testInfo.project.name}.png`
  await stabilizeForScreenshot(page)
  await page.screenshot({ path: testInfo.outputPath(screenshotName), fullPage: true })
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
  } else {
    expect(mode).toBe('unconfigured')
    await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  }
  browser.expectClean()

  await page.goto('/carrito')
  await expect(page.getByRole('heading', { name: 'Tu selección empieza aquí.' })).toBeVisible()
  await expectHealthyPage(page)
  browser.expectClean()

  await page.goto('/checkout')
  if (isConfigured) {
    await expect(page.getByRole('heading', { level: 1, name: 'Terminemos juntas.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío.' })).toBeVisible({ timeout: backendTimeout })
  } else {
    await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  }
  await expect(page.getByText(exposedConfiguration)).toHaveCount(0)
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
    '.current-rail p',
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
    '.trust-faq-list summary',
    '.footer-top',
  ])
  await expectTextContained(page, [
    '.current-rail p',
    '.collection-world-description',
    '.collection-world-name',
    '.collection-section-description',
    '#accesorios .product-copy h3',
  ].join(', '))
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

  const currentMotion = await page.locator('.current-line > span').evaluate((element) => {
    const style = getComputedStyle(element)
    return { animation: style.animationName, transition: style.transitionDuration, transform: style.transform }
  })
  expect(currentMotion.animation).toBe('none')
  expect(longestDurationSeconds(currentMotion.transition)).toBeLessThanOrEqual(0.15)
  expect(currentMotion.transform).toBe('none')

  const spatialMotion = await page.locator([
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
    }
  }))
  expect(spatialMotion.length).toBeGreaterThan(0)
  for (const motion of spatialMotion) {
    expect(motion.animation).toBe('none')
    expect(longestDurationSeconds(motion.transition)).toBeLessThanOrEqual(0.15)
    expect(motion.transform).toBe('none')
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
    }
    expect(longestDurationSeconds(productMotion[1].transitionDelay)).toBe(0)
  }
  browser.expectClean()
})
