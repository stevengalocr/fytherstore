import { expect, test } from '@playwright/test'

test('renders the final storefront without simulated commerce', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Move Different.' })).toBeVisible()
  await expect(page.getByText(/modo demo|productos de demostración|simulación/i)).toHaveCount(0)
  await expect(page.getByText(/Motion Tee|Training Layer|Daily Bag|Recovery Cap/i)).toHaveCount(0)
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath(`home-final-${testInfo.project.name}.png`), fullPage: true })

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await page.getByRole('link', { name: 'Colección' }).first().click()
  } else {
    await page.getByRole('link', { name: 'Colección' }).first().click()
  }

  await expect(page.getByRole('heading', { name: 'Active essentials.' })).toBeVisible()
  await expect(page.getByText(/catálogo se conecta desde bilbildin/i)).toBeVisible()
  await expect(page.getByText(/demo|simulaci/i)).toHaveCount(0)
  expect(browserErrors).toEqual([])
})

test('renders final trust pages', async ({ page }) => {
  for (const route of ['/privacidad', '/terminos', '/envios-cambios']) {
    await page.goto(route)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText(/modo demo|simulación/i)).toHaveCount(0)
    await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  }
})
