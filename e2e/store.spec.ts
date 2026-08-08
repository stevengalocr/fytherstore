import { expect, test } from '@playwright/test'

test('completes the demo storefront journey', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Move Different.' })).toBeVisible()
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath(`home-${testInfo.project.name}.png`), fullPage: true })

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
    await expect(page.getByText('Modo demo').first()).toBeVisible()
    await page.getByRole('link', { name: 'Colección' }).first().click()
  } else {
    await expect(page.getByText('Modo demo').first()).toBeVisible()
    await page.getByRole('link', { name: 'Colección' }).first().click()
  }

  await expect(page.getByRole('heading', { name: 'Active essentials.' })).toBeVisible()
  await page.getByRole('link', { name: /Ver producto/ }).first().click()
  await page.getByRole('button', { name: 'Agregar al carrito' }).click()
  await expect(page.getByRole('link', { name: /Carrito, 1 producto/ })).toBeVisible()
  await page.getByRole('link', { name: /Carrito, 1 producto/ }).click()
  await page.getByRole('link', { name: 'Ir al checkout' }).click()

  await page.getByLabel('Nombre completo').fill('Cliente Demo')
  await page.getByLabel('Correo electrónico').fill('demo@example.com')
  await page.getByLabel('Dirección exacta').fill('Dirección de prueba')
  await page.getByRole('button', { name: /Confirmar pedido/ }).click()
  await expect(page).toHaveURL(/\/confirmacion\/demo-/)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado.' })).toBeVisible()
  await page.getByRole('link', { name: 'Seguir pedido' }).click()
  await expect(page.getByRole('heading', { name: 'En movimiento.' })).toBeVisible()
  expect(browserErrors).toEqual([])
})

test('renders trust pages', async ({ page }) => {
  for (const route of ['/privacidad', '/terminos', '/envios-cambios']) {
    await page.goto(route)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  }
})
