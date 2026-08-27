import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

describe('storefront metadata source', () => {
  const layoutSource = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')
  const truthfulDescription = 'Accesorios originales y nuevas selecciones en camino para acompañar tu movimiento.'

  it('uses the same truthful description for default and OpenGraph metadata', () => {
    expect(layoutSource.match(new RegExp(truthfulDescription, 'g'))).toHaveLength(2)
    expect(layoutSource).not.toContain('Ropa activa seleccionada')
  })

  it('uses the desktop editorial poster for OpenGraph metadata', () => {
    expect(layoutSource).toContain("url: '/editorial/hero-product-campaign-v3.webp'")
    expect(layoutSource).toContain('width: 1920')
    expect(layoutSource).toContain('height: 1080')
    expect(layoutSource).toContain("alt: 'Fyther Store, ropa y accesorios deportivos elegidos con intención'")
  })

  it('publishes a dark browser viewport without duplicate icon metadata', () => {
    expect(layoutSource).toContain("import type { Metadata, Viewport } from 'next'")
    expect(layoutSource).toContain("themeColor: '#050608'")
    expect(layoutSource).toContain("colorScheme: 'dark'")
    expect(layoutSource).not.toMatch(/icons\s*:/)
  })

  it('publishes installable standard and maskable Fyther icons', () => {
    expect(manifest()).toEqual({
      name: 'Fyther Store',
      short_name: 'Fyther',
      description: 'Ropa y accesorios deportivos originales para moverte a tu manera.',
      start_url: '/',
      display: 'standalone',
      background_color: '#050608',
      theme_color: '#050608',
      lang: 'es-CR',
      icons: [
        { src: '/icons/fyther-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/fyther-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/fyther-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    })
  })
})
