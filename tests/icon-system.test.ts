// @vitest-environment node

import { execFile } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

type PngAssetContract = {
  path: string
  width: number
  height: number
  maxBytes: number
  artworkWidth: number
}

type Rgb = readonly [number, number, number]

type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  count: number
}

type IcoFrame = {
  imageOffset: number
  payloadEnd: number
  size: number
}

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const NIGHT_RGB: Rgb = [5, 6, 8]
const CYAN_RGB: Rgb = [110, 239, 242]
const PINK_RGB: Rgb = [240, 108, 203]
const COLOR_TOLERANCE = 60
const execFileAsync = promisify(execFile)

const pngAssets: PngAssetContract[] = [
  { path: 'app/icon.png', width: 512, height: 512, maxBytes: 350_000, artworkWidth: 0.75 },
  { path: 'app/apple-icon.png', width: 180, height: 180, maxBytes: 120_000, artworkWidth: 0.75 },
  { path: 'public/icons/favicon-16.png', width: 16, height: 16, maxBytes: 8_000, artworkWidth: 0.75 },
  { path: 'public/icons/favicon-32.png', width: 32, height: 32, maxBytes: 16_000, artworkWidth: 0.75 },
  { path: 'public/icons/fyther-192.png', width: 192, height: 192, maxBytes: 120_000, artworkWidth: 0.75 },
  { path: 'public/icons/fyther-512.png', width: 512, height: 512, maxBytes: 350_000, artworkWidth: 0.75 },
  { path: 'public/icons/fyther-maskable-512.png', width: 512, height: 512, maxBytes: 350_000, artworkWidth: 0.66 },
]

const generatedAssetPaths = [
  'app/icon.png',
  'app/apple-icon.png',
  'app/favicon.ico',
  'public/icons/favicon-16.png',
  'public/icons/favicon-32.png',
  'public/icons/fyther-192.png',
  'public/icons/fyther-512.png',
  'public/icons/fyther-maskable-512.png',
  '.superpowers/generated-assets/favicon-48.png',
] as const

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

function findBounds(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  predicate: (rgb: Rgb) => boolean,
): Bounds {
  const bounds: Bounds = {
    minX: width,
    minY: height,
    maxX: -1,
    maxY: -1,
    count: 0,
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * channels
      const rgb: Rgb = [data[offset], data[offset + 1], data[offset + 2]]
      if (!predicate(rgb)) continue

      bounds.minX = Math.min(bounds.minX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.maxY = Math.max(bounds.maxY, y)
      bounds.count += 1
    }
  }

  return bounds
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

function expectMonogramGeometry(data: Buffer, size: number, channels: number, label: string) {
  const cyanBounds = findBounds(
    data,
    size,
    size,
    channels,
    (rgb) => isColorLike(rgb, CYAN_RGB, COLOR_TOLERANCE),
  )
  const pinkBounds = findBounds(
    data,
    size,
    size,
    channels,
    (rgb) => rgb.every((channel, index) => channel === PINK_RGB[index]),
  )
  const accentSize = Math.round(size * 0.12)
  const clearance = Math.round(size * 0.10)
  const accentStart = size - clearance - accentSize

  expect(cyanBounds.count, `${label} cyan monogram`).toBeGreaterThan(0)
  expect(cyanBounds.maxY - cyanBounds.minY + 1, `${label} F height`).toBeLessThanOrEqual(
    Math.ceil(size * 0.70),
  )
  expect(cyanBounds.minX, `${label} left clear space`).toBeGreaterThanOrEqual(clearance)
  expect(cyanBounds.minY, `${label} top clear space`).toBeGreaterThanOrEqual(clearance)
  expect(cyanBounds.maxX, `${label} separation from accent`).toBeLessThan(accentStart - 1)
  expect(pinkBounds, `${label} separate pink square`).toEqual({
    minX: accentStart,
    minY: accentStart,
    maxX: accentStart + accentSize - 1,
    maxY: accentStart + accentSize - 1,
    count: accentSize * accentSize,
  })
  expect(size - pinkBounds.maxX - 1, `${label} right clear space`).toBe(clearance)
  expect(size - pinkBounds.maxY - 1, `${label} bottom clear space`).toBe(clearance)
}

function expectWordmarkGeometry(
  data: Buffer,
  size: number,
  channels: number,
  artworkWidth: number,
  label: string,
) {
  const foreground = findBounds(
    data,
    size,
    size,
    channels,
    (rgb) => !isColorLike(rgb, NIGHT_RGB, 3),
  )
  const pinkPixels = countPixels(
    data,
    channels,
    (rgb) => isColorLike(rgb, PINK_RGB, COLOR_TOLERANCE),
  )

  expect(foreground.count, `${label} foreground`).toBeGreaterThan(0)
  expect(foreground.maxX - foreground.minX + 1, `${label} artwork width`).toBeLessThanOrEqual(
    Math.floor(size * artworkWidth),
  )
  expect(foreground.minY, `${label} upper clear band`).toBeGreaterThanOrEqual(
    Math.floor(size * 0.25),
  )
  expect(foreground.maxY, `${label} no-STORE lower band`).toBeLessThan(
    Math.ceil(size * 0.75),
  )
  expect(pinkPixels, `${label} contains no STORE/pink pixels`).toBe(0)
}

function readIcoFrames(contents: Buffer) {
  expect(contents.length).toBeLessThan(100_000)
  expect(contents.length, 'ICO header byte length').toBeGreaterThanOrEqual(6)
  expect(contents.readUInt16LE(0)).toBe(0)
  expect(contents.readUInt16LE(2)).toBe(1)

  const frameCount = contents.readUInt16LE(4)
  expect(frameCount).toBe(3)

  const directoryEnd = 6 + frameCount * 16
  const expectedSizes = [16, 32, 48]
  const frames: IcoFrame[] = []

  expect(contents.length, 'ICO directory byte length').toBeGreaterThanOrEqual(directoryEnd)

  for (const [index, size] of expectedSizes.entries()) {
    const entryOffset = 6 + index * 16
    const width = contents.readUInt8(entryOffset) || 256
    const height = contents.readUInt8(entryOffset + 1) || 256
    const byteCount = contents.readUInt32LE(entryOffset + 8)
    const imageOffset = contents.readUInt32LE(entryOffset + 12)

    expect([width, height], `favicon frame ${index + 1} dimensions`).toEqual([size, size])
    expect(contents.readUInt16LE(entryOffset + 4), `favicon frame ${size} planes`).toBe(1)
    expect(contents.readUInt16LE(entryOffset + 6), `favicon frame ${size} bit count`).toBe(32)
    expect(byteCount, `favicon frame ${size}x${size} byte count`).toBeGreaterThan(0)
    expect(imageOffset, `favicon frame ${size}x${size} offset`).toBeGreaterThanOrEqual(directoryEnd)
    expect(imageOffset, `favicon frame ${size}x${size} offset`).toBeLessThan(contents.length)
    expect(imageOffset + byteCount, `favicon frame ${size}x${size} byte span`).toBeLessThanOrEqual(
      contents.length,
    )

    frames.push({ imageOffset, payloadEnd: imageOffset + byteCount, size })
  }

  const rangeKeys = frames.map(({ imageOffset, payloadEnd }) => `${imageOffset}:${payloadEnd}`)
  expect(new Set(rangeKeys).size, 'ICO payload ranges are unique').toBe(frames.length)

  const sortedRanges = [...frames].sort((left, right) => left.imageOffset - right.imageOffset)
  for (let index = 1; index < sortedRanges.length; index += 1) {
    expect(
      sortedRanges[index].imageOffset,
      `favicon frame ${sortedRanges[index].size}x${sortedRanges[index].size} payload does not overlap`,
    ).toBeGreaterThanOrEqual(sortedRanges[index - 1].payloadEnd)
  }

  return frames
}

function decodeDibFrame(payload: Buffer, size: number) {
  const xorStride = size * 4
  const xorBytes = xorStride * size
  const andStride = Math.ceil(size / 32) * 4
  const andBytes = andStride * size
  const xorOffset = 40
  const andOffset = xorOffset + xorBytes

  expect(payload.readUInt32LE(0), `${size}px DIB header size`).toBe(40)
  expect(payload.readInt32LE(4), `${size}px DIB width`).toBe(size)
  expect(payload.readInt32LE(8), `${size}px doubled DIB height`).toBe(size * 2)
  expect(payload.readUInt16LE(12), `${size}px DIB planes`).toBe(1)
  expect(payload.readUInt16LE(14), `${size}px DIB bit count`).toBe(32)
  expect(payload.readUInt32LE(16), `${size}px DIB compression`).toBe(0)
  expect(payload.readUInt32LE(20), `${size}px DIB XOR byte size`).toBe(xorBytes)
  expect(payload.length, `${size}px DIB XOR and AND bounds`).toBe(andOffset + andBytes)
  expect(
    payload.subarray(andOffset).every((byte) => byte === 0),
    `${size}px DIB AND mask is zeroed`,
  ).toBe(true)

  const rgb = Buffer.alloc(size * size * 3)
  for (let y = 0; y < size; y += 1) {
    const sourceY = size - y - 1
    for (let x = 0; x < size; x += 1) {
      const sourceOffset = xorOffset + sourceY * xorStride + x * 4
      const outputOffset = (y * size + x) * 3
      rgb[outputOffset] = payload[sourceOffset + 2]
      rgb[outputOffset + 1] = payload[sourceOffset + 1]
      rgb[outputOffset + 2] = payload[sourceOffset]
      expect(payload[sourceOffset + 3], `${size}px DIB pixel alpha`).toBe(255)
    }
  }

  return rgb
}

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
    expectIconPalette(data, info.width, info.height, info.channels, asset.path, asset.width <= 32)

    if (asset.width <= 32) {
      expectMonogramGeometry(data, asset.width, info.channels, asset.path)
    } else {
      expectWordmarkGeometry(data, asset.width, info.channels, asset.artworkWidth, asset.path)
    }
  })

  it('app/favicon.ico contains standards-compatible 32-bit DIB frames', async () => {
    const contents = await readFile(resolve(ROOT, 'app/favicon.ico'))
    const frames = readIcoFrames(contents)

    for (const frame of frames) {
      const payload = contents.subarray(frame.imageOffset, frame.payloadEnd)
      const rgb = decodeDibFrame(payload, frame.size)
      expectNightCorners(rgb, frame.size, frame.size, 3, `favicon frame ${frame.size}x${frame.size}`)
      expectIconPalette(rgb, frame.size, frame.size, 3, `favicon frame ${frame.size}x${frame.size}`, frame.size <= 32)

      if (frame.size <= 32) {
        expectMonogramGeometry(rgb, frame.size, 3, `favicon frame ${frame.size}x${frame.size}`)
      } else {
        expectWordmarkGeometry(rgb, frame.size, 3, 0.75, `favicon frame ${frame.size}x${frame.size}`)
      }
    }
  })

  it.runIf(process.platform === 'win32')('app/favicon.ico decodes through Windows WIC', async () => {
    const iconPath = resolve(ROOT, 'app/favicon.ico').replaceAll("'", "''")
    const script = [
      "$ErrorActionPreference='Stop'",
      'Add-Type -AssemblyName PresentationCore',
      `$stream=[System.IO.File]::OpenRead('${iconPath}')`,
      'try {',
      '  $decoder=[System.Windows.Media.Imaging.IconBitmapDecoder]::new($stream,[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)',
      "  [pscustomobject]@{FrameCount=$decoder.Frames.Count;Sizes=@($decoder.Frames | ForEach-Object { '{0}x{1}' -f $_.PixelWidth,$_.PixelHeight })} | ConvertTo-Json -Compress",
      '} finally { $stream.Dispose() }',
    ].join(';')
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8' },
    )

    const result = JSON.parse(stdout.trim()) as { FrameCount: number, Sizes: string[] }
    expect(result.FrameCount).toBe(3)
    expect([...result.Sizes].sort()).toEqual(['16x16', '32x32', '48x48'])
  })

  it('generates deterministic assets in independent temporary roots without running on import', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const moduleUrl = pathToFileURL(resolve(ROOT, 'scripts/prepare-fyther-icons.mjs')).href
    const imported = await import(moduleUrl) as {
      generateFytherIcons?: (root: string) => Promise<void>
    }

    expect(log).not.toHaveBeenCalled()
    expect(imported.generateFytherIcons).toBeTypeOf('function')

    const temporaryParent = await mkdtemp(join(tmpdir(), 'fyther-icons-'))
    const temporaryRoots = [join(temporaryParent, 'first'), join(temporaryParent, 'second')]

    try {
      for (const temporaryRoot of temporaryRoots) {
        await mkdir(resolve(temporaryRoot, 'public'), { recursive: true })
        await copyFile(resolve(ROOT, 'public/logo1.png'), resolve(temporaryRoot, 'public/logo1.png'))
        await imported.generateFytherIcons?.(temporaryRoot)
      }

      for (const assetPath of generatedAssetPaths) {
        const [first, second] = await Promise.all(
          temporaryRoots.map((temporaryRoot) => readFile(resolve(temporaryRoot, assetPath))),
        )
        expect(first.equals(second), `${assetPath} is root-independent`).toBe(true)

        if (!assetPath.startsWith('.superpowers/')) {
          const committed = await readFile(resolve(ROOT, assetPath))
          expect(first.equals(committed), `${assetPath} matches committed output`).toBe(true)
        }
      }
    } finally {
      log.mockRestore()
      await rm(temporaryParent, { recursive: true, force: true })
    }
  }, 30_000)
})
