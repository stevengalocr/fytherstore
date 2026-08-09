import { expect, test, type Page, type Request } from '@playwright/test'

const forbiddenCommerceCopy = /modo demo|productos de demostraci[oó]n|simulaci[oó]n|Motion Tee|Training Layer|Daily Bag|Recovery Cap/i
const exposedConfiguration = /Supabase|service_role|\bkey\b|endpoint|\bdemo\b|simulaci/i
const frameworkDialog = '[data-nextjs-dialog]'
const backendTimeout = 15_000

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
    root.style.scrollBehavior = previousBehavior
  })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
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
  const isLive = testInfo.project.name.endsWith('-live')
  const isUnconfigured = testInfo.project.name.endsWith('-unconfigured')
  expect(isLive || isUnconfigured).toBe(true)

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
  expect(worldBoxes.every(Boolean)).toBe(true)
  const [firstWorld, secondWorld] = worldBoxes
  if (isLive && isDesktop && firstWorld && secondWorld) {
    expect(Math.abs(firstWorld.y - secondWorld.y)).toBeLessThanOrEqual(1)
    expect(firstWorld.x + firstWorld.width).toBeLessThanOrEqual(secondWorld.x + 1)
  } else if (isLive && !isDesktop && firstWorld && secondWorld) {
    expect(firstWorld.y + firstWorld.height).toBeLessThanOrEqual(secondWorld.y + 1)
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

  await expect.poll(() => page.locator('.collection-world-media img').evaluateAll((images) => images.map((image) => {
    const media = image as HTMLImageElement
    return media.complete && media.naturalWidth > 0
  }))).toEqual([true, true])

  const revealedSecondPanelDelay = await worldPanels.nth(1).evaluate((element) => getComputedStyle(element).transitionDelay)
  expect(longestDurationSeconds(revealedSecondPanelDelay)).toBe(0)

  await expectNoHorizontalClipping(page, [
    '.hero-content',
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

  if (isLive) {
    const liveSections = [
      '.hero-section',
      '.current-rail',
      '.collection-worlds',
      '#ropa.collection-section',
      '.editorial-story',
      '#accesorios.collection-section',
      '#preguntas',
      '.site-footer',
    ]
    await expectVerticalOrder(page, liveSections)
    await expectNoOverlap(page, liveSections)
  }

  await expectFooterMarkContained(page)
  await page.screenshot({ path: testInfo.outputPath(`home-v02-${testInfo.project.name}.png`), fullPage: true })
  browser.expectClean()
})

test('mobile and tablet menu closes with Escape and returns focus', async ({ page }, testInfo) => {
  const isDesktop = testInfo.project.name.startsWith('desktop')
  const isLive = testInfo.project.name.endsWith('-live')
  test.skip(isDesktop || !isLive, 'The mobile menu runs only in tablet-live and mobile-live')
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
  const isLive = testInfo.project.name.endsWith('-live')
  const isUnconfigured = testInfo.project.name.endsWith('-unconfigured')
  expect(isLive || isUnconfigured).toBe(true)

  await page.goto('/catalogo')
  await expect(page.locator('.catalog-loading')).toHaveCount(0, { timeout: backendTimeout })
  const catalogH1 = page.locator('h1:visible')
  await expect(catalogH1).toHaveCount(1)
  await expect(catalogH1).toBeVisible()
  await expect(page.getByText(exposedConfiguration)).toHaveCount(0)
  await expectHealthyPage(page)

  if (isLive) {
    await expect(catalogH1).toHaveText('Encuentra algo para ti.', { timeout: backendTimeout })
    await expect(page.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: backendTimeout })
  } else {
    expect(isUnconfigured).toBe(true)
    await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible({ timeout: backendTimeout })
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  }
  browser.expectClean()

  await page.goto('/carrito')
  await expect(page.getByRole('heading', { name: 'Tu selección empieza aquí.' })).toBeVisible()
  await expectHealthyPage(page)
  browser.expectClean()

  await page.goto('/checkout')
  if (isLive) {
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

test('disables ambient motion when reduced motion is requested', async ({ page }) => {
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
  browser.expectClean()
})
