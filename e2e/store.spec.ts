import { expect, test, type Page } from '@playwright/test'

const forbiddenCommerceCopy = /modo demo|productos de demostraci[oó]n|simulaci[oó]n|Motion Tee|Training Layer|Daily Bag|Recovery Cap/i
const exposedConfiguration = /Supabase|service_role|\bkey\b|endpoint|\bdemo\b|simulaci/i
const frameworkDialog = '[data-nextjs-dialog]'

function watchConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
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

async function revealFullPage(page: Page) {
  const dimensions = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, viewport: window.innerHeight }))
  const step = Math.max(200, Math.floor(dimensions.viewport * 0.7))
  for (let y = 0; y < dimensions.height; y += step) {
    await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), y)
    await page.waitForTimeout(80)
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(150)
  await expect.poll(() => page.locator('[data-reveal]:not([data-reveal="on"])').count()).toBe(0)
  await page.evaluate(() => window.scrollTo(0, 0))
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
  const browserErrors = watchConsoleErrors(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Muévete a tu manera.', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver la colección' }).first()).toBeVisible()
  await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
  await expectHealthyPage(page)

  const current = page.locator('[data-current]')
  await expect(current).toBeVisible()
  const currentBox = await current.boundingBox()
  expect(currentBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(testInfo.project.use.viewport?.height ?? 1000)

  const mobileHeader = testInfo.project.name !== 'desktop'
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

  await revealFullPage(page)
  await page.screenshot({ path: testInfo.outputPath(`home-v02-${testInfo.project.name}.png`), fullPage: true })
  expect(browserErrors).toEqual([])
})

test('mobile and tablet menu closes with Escape and returns focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Desktop uses the inline navigation')
  const browserErrors = watchConsoleErrors(page)

  await page.goto('/')
  const trigger = page.locator('.menu-button')
  await expect(trigger).toBeVisible()
  await expect(trigger).toHaveAccessibleName('Abrir menú')
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.locator('#primary-navigation').getByRole('link', { name: 'Colección', exact: true }).click()
  await expect(page).toHaveURL(/\/catalogo$/)
  await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible()
  await expectHealthyPage(page)
  expect(browserErrors).toEqual([])
})

test('renders final trust pages without internal language', async ({ page }) => {
  const browserErrors = watchConsoleErrors(page)

  for (const route of ['/privacidad', '/terminos', '/envios-cambios']) {
    await page.goto(route)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText(forbiddenCommerceCopy)).toHaveCount(0)
    await expectHealthyPage(page)
  }
  expect(browserErrors).toEqual([])
})

test('keeps unconfigured catalog, cart, and checkout truthful and stable', async ({ page }) => {
  const browserErrors = watchConsoleErrors(page)

  await page.goto('/catalogo')
  await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible()
  await expect(page.getByText(exposedConfiguration)).toHaveCount(0)
  await expectHealthyPage(page)

  await page.goto('/carrito')
  await expect(page.getByRole('heading', { name: 'Tu selección empieza aquí.' })).toBeVisible()
  await expectHealthyPage(page)

  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeVisible()
  await expect(page.getByText(exposedConfiguration)).toHaveCount(0)
  await expectHealthyPage(page)
  expect(browserErrors).toEqual([])
})

test('disables ambient motion when reduced motion is requested', async ({ page }) => {
  const browserErrors = watchConsoleErrors(page)
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

  await expect(page.locator('.hero-media video')).toHaveCount(0)
  const currentMotion = await page.locator('.current-line > span').evaluate((element) => {
    const style = getComputedStyle(element)
    return { animation: style.animationName, transition: style.transitionDuration, transform: style.transform }
  })
  expect(currentMotion.animation).toBe('none')
  expect(longestDurationSeconds(currentMotion.transition)).toBeLessThanOrEqual(0.15)
  expect(currentMotion.transform).toBe('none')

  const cameraMotion = await page.locator('[data-camera]').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element)
    return [style.animationDuration, style.transitionDuration]
  }))
  for (const durations of cameraMotion) {
    expect(longestDurationSeconds(durations[0])).toBeLessThanOrEqual(0.15)
    expect(longestDurationSeconds(durations[1])).toBeLessThanOrEqual(0.15)
  }
  expect(browserErrors).toEqual([])
})
