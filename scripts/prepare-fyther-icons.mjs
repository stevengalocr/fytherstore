import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const NIGHT = { r: 5, g: 6, b: 8 }
const CYAN = { r: 110, g: 239, b: 242 }
const PINK = { r: 240, g: 108, b: 203 }

// Fixed against the approved 1254 px source. The lower edge is above STORE.
const FYTHER_CROP = { left: 132, top: 320, width: 1004, height: 405 }
const F_CROP = { left: 132, top: 320, width: 166, height: 405 }

const STANDARD_ARTWORK_WIDTH = 0.75
const MASKABLE_ARTWORK_WIDTH = 0.66
const MONOGRAM_HEIGHT = 0.70
const ACCENT_SIZE = 0.12
const ACCENT_CLEARANCE = 0.10
const PNG_OPTIONS = {
  adaptiveFiltering: false,
  compressionLevel: 9,
  effort: 10,
  palette: false,
}

sharp.cache(false)
sharp.concurrency(1)

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value))
  return clamped * clamped * (3 - 2 * clamped)
}

async function extractArtwork(source, crop) {
  const { data, info } = await sharp(source)
    .extract(crop)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const artwork = Buffer.alloc(info.width * info.height * 4)

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const sourceOffset = (y * info.width + x) * info.channels
      const outputOffset = (y * info.width + x) * 4
      const signal = Math.max(data[sourceOffset + 1], data[sourceOffset + 2])
      const alpha = Math.round(smoothstep((signal - 24) / 72) * 255)

      artwork[outputOffset] = CYAN.r
      artwork[outputOffset + 1] = CYAN.g
      artwork[outputOffset + 2] = CYAN.b
      artwork[outputOffset + 3] = alpha
    }
  }

  return {
    data: artwork,
    raw: { width: info.width, height: info.height, channels: 4 },
  }
}

async function resizeArtwork(artwork, resize) {
  return sharp(artwork.data, { raw: artwork.raw })
    .resize({ ...resize, fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true })
}

async function renderIcon(artwork, size, artworkWidth) {
  const resized = await resizeArtwork(artwork, {
    width: Math.floor(size * artworkWidth),
  })
  const left = Math.floor((size - resized.info.width) / 2)
  const top = Math.floor((size - resized.info.height) / 2)

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: NIGHT,
    },
  })
    .composite([{
      input: resized.data,
      raw: {
        width: resized.info.width,
        height: resized.info.height,
        channels: 4,
      },
      left,
      top,
    }])
    .removeAlpha()
    .png(PNG_OPTIONS)
    .toBuffer()
}

async function renderMonogram(artwork, size) {
  const resized = await resizeArtwork(artwork, {
    height: Math.round(size * MONOGRAM_HEIGHT),
  })
  const left = Math.floor((size - resized.info.width) / 2)
  const top = Math.floor((size - resized.info.height) / 2)
  const accentSize = Math.round(size * ACCENT_SIZE)
  const accentClearance = Math.round(size * ACCENT_CLEARANCE)
  const accentPosition = size - accentClearance - accentSize
  const accent = Buffer.alloc(accentSize * accentSize * 3)

  for (let offset = 0; offset < accent.length; offset += 3) {
    accent[offset] = PINK.r
    accent[offset + 1] = PINK.g
    accent[offset + 2] = PINK.b
  }

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: NIGHT,
    },
  })
    .composite([
      {
        input: resized.data,
        raw: {
          width: resized.info.width,
          height: resized.info.height,
          channels: 4,
        },
        left,
        top,
      },
      {
        input: accent,
        raw: { width: accentSize, height: accentSize, channels: 3 },
        left: accentPosition,
        top: accentPosition,
      },
    ])
    .removeAlpha()
    .png(PNG_OPTIONS)
    .toBuffer()
}

async function encodeDibFrame(png, size) {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.width !== size || info.height !== size || info.channels !== 3) {
    throw new Error(`Expected an opaque ${size}x${size} RGB favicon frame`)
  }

  const xorStride = size * 4
  const xorBytes = xorStride * size
  const andStride = Math.ceil(size / 32) * 4
  const andBytes = andStride * size
  const dib = Buffer.alloc(40 + xorBytes + andBytes)

  dib.writeUInt32LE(40, 0)
  dib.writeInt32LE(size, 4)
  dib.writeInt32LE(size * 2, 8)
  dib.writeUInt16LE(1, 12)
  dib.writeUInt16LE(32, 14)
  dib.writeUInt32LE(0, 16)
  dib.writeUInt32LE(xorBytes, 20)

  for (let dibY = 0; dibY < size; dibY += 1) {
    const sourceY = size - dibY - 1
    for (let x = 0; x < size; x += 1) {
      const sourceOffset = (sourceY * size + x) * info.channels
      const outputOffset = 40 + dibY * xorStride + x * 4

      dib[outputOffset] = data[sourceOffset + 2]
      dib[outputOffset + 1] = data[sourceOffset + 1]
      dib[outputOffset + 2] = data[sourceOffset]
      dib[outputOffset + 3] = 255
    }
  }

  return dib
}

function packIco(frames) {
  const directorySize = 6 + frames.length * 16
  const ico = Buffer.alloc(directorySize + frames.reduce((sum, frame) => sum + frame.dib.length, 0))

  ico.writeUInt16LE(0, 0)
  ico.writeUInt16LE(1, 2)
  ico.writeUInt16LE(frames.length, 4)

  let imageOffset = directorySize
  frames.forEach((frame, index) => {
    const entryOffset = 6 + index * 16
    ico.writeUInt8(frame.size === 256 ? 0 : frame.size, entryOffset)
    ico.writeUInt8(frame.size === 256 ? 0 : frame.size, entryOffset + 1)
    ico.writeUInt8(0, entryOffset + 2)
    ico.writeUInt8(0, entryOffset + 3)
    ico.writeUInt16LE(1, entryOffset + 4)
    ico.writeUInt16LE(32, entryOffset + 6)
    ico.writeUInt32LE(frame.dib.length, entryOffset + 8)
    ico.writeUInt32LE(imageOffset, entryOffset + 12)
    frame.dib.copy(ico, imageOffset)
    imageOffset += frame.dib.length
  })

  return ico
}

async function writeAsset(path, contents) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents)
}

export async function generateFytherIcons(root) {
  const outputRoot = resolve(root)
  const source = resolve(outputRoot, 'public/logo1.png')
  const generatedAssets = resolve(outputRoot, '.superpowers/generated-assets')
  const [fyther, monogram] = await Promise.all([
    extractArtwork(source, FYTHER_CROP),
    extractArtwork(source, F_CROP),
  ])
  const [favicon16, favicon32, favicon48, apple180, standard192, standard512, maskable512] = await Promise.all([
    renderMonogram(monogram, 16),
    renderMonogram(monogram, 32),
    renderIcon(fyther, 48, STANDARD_ARTWORK_WIDTH),
    renderIcon(fyther, 180, STANDARD_ARTWORK_WIDTH),
    renderIcon(fyther, 192, STANDARD_ARTWORK_WIDTH),
    renderIcon(fyther, 512, STANDARD_ARTWORK_WIDTH),
    renderIcon(fyther, 512, MASKABLE_ARTWORK_WIDTH),
  ])
  const faviconFrames = [
    { size: 16, png: favicon16 },
    { size: 32, png: favicon32 },
    { size: 48, png: favicon48 },
  ]
  const faviconIco = packIco(await Promise.all(
    faviconFrames.map(async ({ size, png }) => ({
      size,
      dib: await encodeDibFrame(png, size),
    })),
  ))

  await Promise.all([
    writeAsset(resolve(outputRoot, 'app/icon.png'), standard512),
    writeAsset(resolve(outputRoot, 'app/apple-icon.png'), apple180),
    writeAsset(resolve(outputRoot, 'app/favicon.ico'), faviconIco),
    writeAsset(resolve(outputRoot, 'public/icons/favicon-16.png'), favicon16),
    writeAsset(resolve(outputRoot, 'public/icons/favicon-32.png'), favicon32),
    writeAsset(resolve(outputRoot, 'public/icons/fyther-192.png'), standard192),
    writeAsset(resolve(outputRoot, 'public/icons/fyther-512.png'), standard512),
    writeAsset(resolve(outputRoot, 'public/icons/fyther-maskable-512.png'), maskable512),
    writeAsset(resolve(generatedAssets, 'favicon-48.png'), favicon48),
  ])
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateFytherIcons(DEFAULT_ROOT)
  console.log('[fyther-icons] generated adaptive icon family')
}
