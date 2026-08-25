import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

type AssetContract = {
  path: string
  width: number
  height: number
  hasAlpha: boolean
  maxBytes: number
}

const assets: AssetContract[] = [
  {
    path: 'public/brand/fyther-mark-header.webp',
    width: 640,
    height: 640,
    hasAlpha: true,
    maxBytes: 500_000,
  },
  {
    path: 'public/brand/fyther-mark-footer.webp',
    width: 960,
    height: 960,
    hasAlpha: true,
    maxBytes: 500_000,
  },
  {
    path: 'public/brand/fyther-wordmark-header.webp',
    width: 576,
    height: 384,
    hasAlpha: true,
    maxBytes: 300_000,
  },
  {
    path: 'public/editorial/hero-poster-desktop.webp',
    width: 2400,
    height: 1350,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/hero-poster-mobile.webp',
    width: 1200,
    height: 1500,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/hero-open-suitcase-branded.webp',
    width: 1920,
    height: 1080,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/hero-open-suitcase-branded-mobile.webp',
    width: 1200,
    height: 1500,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/hero-product-campaign-v3.webp',
    width: 1920,
    height: 1080,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/hero-product-campaign-v3-mobile.webp',
    width: 1200,
    height: 1500,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/collection-ropa.webp',
    width: 1600,
    height: 2000,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/collection-accesorios.webp',
    width: 1600,
    height: 2000,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/community-movement.webp',
    width: 2000,
    height: 1200,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/footer-movement.webp',
    width: 1800,
    height: 900,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/footer-community-v2.webp',
    width: 1920,
    height: 1080,
    hasAlpha: false,
    maxBytes: 700_000,
  },
  {
    path: 'public/editorial/footer-product-campaign-v3.webp',
    width: 1920,
    height: 1080,
    hasAlpha: false,
    maxBytes: 700_000,
  },
]

const approvedCampaignAssets = [
  {
    path: 'public/editorial/hero-product-campaign-v3.webp',
    sha256: '4147f2cb146fadf91fbbeca9941f83ff25038f61ca322d6216711e1ac71e86d5',
  },
  {
    path: 'public/editorial/hero-product-campaign-v3-mobile.webp',
    sha256: '3bcfa081864a031e72734052633330f615ab66440811891b26fed9f7f5318cdb',
  },
  {
    path: 'public/editorial/footer-product-campaign-v3.webp',
    sha256: 'babe72c697ad4a38427c4dbbe8301e2ede3053cf823825b7d4078a7ceb93bae3',
  },
]

describe('Fyther image asset contract', () => {
  it.each(assets)('$path matches its delivery contract', async (asset) => {
    const file = resolve(process.cwd(), asset.path)
    const metadata = await sharp(file).metadata()

    expect(metadata.format).toBe('webp')
    expect(metadata.width).toBe(asset.width)
    expect(metadata.height).toBe(asset.height)
    expect(metadata.hasAlpha).toBe(asset.hasAlpha)
    expect(statSync(file).size).toBeLessThan(asset.maxBytes)
  })

  it.each(approvedCampaignAssets)('$path matches its approved product-only SHA-256', (asset) => {
    const contents = readFileSync(resolve(process.cwd(), asset.path))
    expect(createHash('sha256').update(contents).digest('hex')).toBe(asset.sha256)
  })
})
