import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

type PngAssetContract = {
  path: string
  width: number
  height: number
  maxBytes: number
}

const NIGHT_RGB = [5, 6, 8]

const pngAssets: PngAssetContract[] = [
  { path: 'app/icon.png', width: 512, height: 512, maxBytes: 350_000 },
  { path: 'app/apple-icon.png', width: 180, height: 180, maxBytes: 120_000 },
  { path: 'public/icons/favicon-16.png', width: 16, height: 16, maxBytes: 8_000 },
  { path: 'public/icons/favicon-32.png', width: 32, height: 32, maxBytes: 16_000 },
  { path: 'public/icons/fyther-192.png', width: 192, height: 192, maxBytes: 120_000 },
  { path: 'public/icons/fyther-512.png', width: 512, height: 512, maxBytes: 350_000 },
  { path: 'public/icons/fyther-maskable-512.png', width: 512, height: 512, maxBytes: 350_000 },
]

describe('Fyther icon asset contract', () => {
  it.each(pngAssets)('$path is an opaque night-backed PNG within its delivery budget', async (asset) => {
    const file = resolve(process.cwd(), asset.path)
    const image = sharp(file)
    const metadata = await image.metadata()

    expect(metadata.format).toBe('png')
    expect(metadata.width).toBe(asset.width)
    expect(metadata.height).toBe(asset.height)
    expect(metadata.hasAlpha).toBe(false)
    await expect(stat(file).then(({ size }) => size)).resolves.toBeLessThan(asset.maxBytes)

    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
    const corners = [
      { name: 'top-left', x: 0, y: 0 },
      { name: 'top-right', x: asset.width - 1, y: 0 },
      { name: 'bottom-left', x: 0, y: asset.height - 1 },
      { name: 'bottom-right', x: asset.width - 1, y: asset.height - 1 },
    ]

    for (const corner of corners) {
      const offset = (corner.y * info.width + corner.x) * info.channels
      const rgb = Array.from(data.subarray(offset, offset + 3))
      expect(rgb, `${asset.path} ${corner.name} pixel`).toEqual(NIGHT_RGB)
    }
  })

  it('app/favicon.ico contains bounded 16, 32, and 48 px frames', async () => {
    const file = resolve(process.cwd(), 'app/favicon.ico')
    const contents = await readFile(file)

    expect(contents.length).toBeLessThan(100_000)
    expect(contents.readUInt16LE(0)).toBe(0)
    expect(contents.readUInt16LE(2)).toBe(1)

    const frameCount = contents.readUInt16LE(4)
    expect(frameCount).toBe(3)

    const directoryEnd = 6 + frameCount * 16
    const expectedSizes = [16, 32, 48]

    expectedSizes.forEach((size, index) => {
      const entryOffset = 6 + index * 16
      const width = contents.readUInt8(entryOffset) || 256
      const height = contents.readUInt8(entryOffset + 1) || 256
      const byteCount = contents.readUInt32LE(entryOffset + 8)
      const imageOffset = contents.readUInt32LE(entryOffset + 12)

      expect([width, height], `favicon frame ${index + 1} dimensions`).toEqual([size, size])
      expect(byteCount, `favicon frame ${size}x${size} byte count`).toBeGreaterThan(0)
      expect(imageOffset, `favicon frame ${size}x${size} offset`).toBeGreaterThanOrEqual(directoryEnd)
      expect(imageOffset, `favicon frame ${size}x${size} offset`).toBeLessThan(contents.length)
      expect(
        imageOffset + byteCount,
        `favicon frame ${size}x${size} byte span`,
      ).toBeLessThanOrEqual(contents.length)
    })
  })
})
