// @vitest-environment node

import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

type PngAssetContract = {
  path: string
  width: number
  height: number
  maxBytes: number
}

type Rgb = readonly [number, number, number]

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const NIGHT_RGB: Rgb = [5, 6, 8]
const CYAN_RGB: Rgb = [110, 239, 242]
const PINK_RGB: Rgb = [240, 108, 203]
const COLOR_TOLERANCE = 60

function isColorLike(rgb: Rgb, target: Rgb, tolerance: number) {
  return rgb.every((channel, index) => Math.abs(channel - target[index]) <= tolerance)
}

function countPixels(
  data: Buffer,
  channels: number,
  predicate: (rgb: Rgb) => boolean,
) {
  let count = 0

  for (let offset = 0; offset < data.length; offset += channels) {
    const rgb: Rgb = [data[offset], data[offset + 1], data[offset + 2]]
    if (predicate(rgb)) count += 1
  }

  return count
}

function expectNightCorners(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  label: string,
) {
  expect(channels, `${label} raw channel count`).toBe(3)

  const corners = [
    { name: 'top-left', x: 0, y: 0 },
    { name: 'top-right', x: width - 1, y: 0 },
    { name: 'bottom-left', x: 0, y: height - 1 },
    { name: 'bottom-right', x: width - 1, y: height - 1 },
  ]

  for (const corner of corners) {
    const offset = (corner.y * width + corner.x) * channels
    const rgb = Array.from(data.subarray(offset, offset + 3))
    expect(rgb, `${label} ${corner.name} pixel`).toEqual(NIGHT_RGB)
  }
}

function expectIconPalette(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  label: string,
  requiresPink: boolean,
) {
  const pixelCount = width * height
  const foregroundPixels = countPixels(
    data,
    channels,
    (rgb) => !isColorLike(rgb, NIGHT_RGB, 3),
  )
  const cyanPixels = countPixels(
    data,
    channels,
    (rgb) => isColorLike(rgb, CYAN_RGB, COLOR_TOLERANCE),
  )

  expect(foregroundPixels, `${label} foreground pixel coverage`).toBeGreaterThanOrEqual(
    Math.ceil(pixelCount * 0.02),
  )
  expect(cyanPixels, `${label} cyan-like pixel coverage`).toBeGreaterThanOrEqual(
    Math.max(2, Math.ceil(pixelCount * 0.002)),
  )

  if (requiresPink) {
    const pinkPixels = countPixels(
      data,
      channels,
      (rgb) => isColorLike(rgb, PINK_RGB, COLOR_TOLERANCE),
    )
    expect(pinkPixels, `${label} pink-like pixel coverage`).toBeGreaterThanOrEqual(
      Math.max(1, Math.ceil(pixelCount * 0.001)),
    )
  }
}

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
    const file = resolve(ROOT, asset.path)
    const image = sharp(file)
    const metadata = await image.metadata()

    expect(metadata.format).toBe('png')
    expect(metadata.width).toBe(asset.width)
    expect(metadata.height).toBe(asset.height)
    expect(metadata.hasAlpha).toBe(false)
    await expect(stat(file).then(({ size }) => size)).resolves.toBeLessThan(asset.maxBytes)

    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
    expectNightCorners(data, info.width, info.height, info.channels, asset.path)

    expectIconPalette(
      data,
      info.width,
      info.height,
      info.channels,
      asset.path,
      asset.width <= 32,
    )
  })

  it('app/favicon.ico contains bounded 16, 32, and 48 px frames', async () => {
    const file = resolve(ROOT, 'app/favicon.ico')
    const contents = await readFile(file)

    expect(contents.length).toBeLessThan(100_000)
    expect(contents.length, 'ICO header byte length').toBeGreaterThanOrEqual(6)
    expect(contents.readUInt16LE(0)).toBe(0)
    expect(contents.readUInt16LE(2)).toBe(1)

    const frameCount = contents.readUInt16LE(4)
    expect(frameCount).toBe(3)

    const directoryEnd = 6 + frameCount * 16
    const expectedSizes = [16, 32, 48]
    const frames: Array<{
      imageOffset: number
      payloadEnd: number
      size: number
    }> = []

    expect(contents.length, 'ICO directory byte length').toBeGreaterThanOrEqual(directoryEnd)

    for (const [index, size] of expectedSizes.entries()) {
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

      const payloadEnd = imageOffset + byteCount
      frames.push({ imageOffset, payloadEnd, size })
    }

    const rangeKeys = frames.map(({ imageOffset, payloadEnd }) => `${imageOffset}:${payloadEnd}`)
    expect(new Set(rangeKeys).size, 'ICO payload ranges are unique').toBe(frames.length)

    const sortedRanges = [...frames].sort((left, right) => left.imageOffset - right.imageOffset)
    for (let index = 1; index < sortedRanges.length; index += 1) {
      const previous = sortedRanges[index - 1]
      const current = sortedRanges[index]
      expect(
        current.imageOffset,
        `favicon frame ${current.size}x${current.size} payload does not overlap another frame`,
      ).toBeGreaterThanOrEqual(previous.payloadEnd)
    }

    for (const frame of frames) {
      const payload = contents.subarray(frame.imageOffset, frame.payloadEnd)
      const image = sharp(payload)
      const metadata = await image.metadata()
      expect(metadata.format, `favicon frame ${frame.size}x${frame.size} payload format`).toBe('png')
      expect(
        [metadata.width, metadata.height],
        `favicon frame ${frame.size}x${frame.size} payload dimensions`,
      ).toEqual([frame.size, frame.size])
      expect(metadata.hasAlpha, `favicon frame ${frame.size}x${frame.size} payload alpha`).toBe(false)

      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
      expectNightCorners(
        data,
        info.width,
        info.height,
        info.channels,
        `favicon frame ${frame.size}x${frame.size}`,
      )
      expectIconPalette(
        data,
        info.width,
        info.height,
        info.channels,
        `favicon frame ${frame.size}x${frame.size}`,
        frame.size <= 32,
      )
    }
  })
})
