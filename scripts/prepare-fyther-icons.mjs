import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, 'public/logo1.png')
const GENERATED_ASSETS = resolve(ROOT, '.superpowers/generated-assets')

const NIGHT = { r: 5, g: 6, b: 8 }
const CYAN = { r: 110, g: 239, b: 242 }
const PINK = { r: 240, g: 108, b: 203 }

// Fixed against the approved 1254 px source. The lower edge is above STORE.
const FYTHER_CROP = { left: 132, top: 320, width: 1004, height: 405 }
const F_CROP = { left: 132, top: 320, width: 166, height: 405 }
const F_PINK_ACCENT = { left: 80, top: 176, right: 166, bottom: 243 }

const STANDARD_ARTWORK_WIDTH = 0.75
const MASKABLE_ARTWORK_WIDTH = 0.66
const MONOGRAM_HEIGHT = 0.84
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

function isInside(x, y, bounds) {
  return x >= bounds.left
    && x < bounds.right
    && y >= bounds.top
    && y < bounds.bottom
}

async function extractArtwork(crop, pinkAccent) {
  const { data, info } = await sharp(SOURCE)
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
      const color = pinkAccent && isInside(x, y, pinkAccent) ? PINK : CYAN

      artwork[outputOffset] = color.r
      artwork[outputOffset + 1] = color.g
      artwork[outputOffset + 2] = color.b
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

function packIco(frames) {
  const directorySize = 6 + frames.length * 16
  const ico = Buffer.alloc(directorySize + frames.reduce((sum, frame) => sum + frame.png.length, 0))

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
    ico.writeUInt16LE(24, entryOffset + 6)
    ico.writeUInt32LE(frame.png.length, entryOffset + 8)
    ico.writeUInt32LE(imageOffset, entryOffset + 12)
    frame.png.copy(ico, imageOffset)
    imageOffset += frame.png.length
  })

  return ico
}

async function writeAsset(path, contents) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents)
}

async function main() {
  const [fyther, monogram] = await Promise.all([
    extractArtwork(FYTHER_CROP),
    extractArtwork(F_CROP, F_PINK_ACCENT),
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
  const faviconIco = packIco([
    { size: 16, png: favicon16 },
    { size: 32, png: favicon32 },
    { size: 48, png: favicon48 },
  ])

  await Promise.all([
    writeAsset(resolve(ROOT, 'app/icon.png'), standard512),
    writeAsset(resolve(ROOT, 'app/apple-icon.png'), apple180),
    writeAsset(resolve(ROOT, 'app/favicon.ico'), faviconIco),
    writeAsset(resolve(ROOT, 'public/icons/favicon-16.png'), favicon16),
    writeAsset(resolve(ROOT, 'public/icons/favicon-32.png'), favicon32),
    writeAsset(resolve(ROOT, 'public/icons/fyther-192.png'), standard192),
    writeAsset(resolve(ROOT, 'public/icons/fyther-512.png'), standard512),
    writeAsset(resolve(ROOT, 'public/icons/fyther-maskable-512.png'), maskable512),
    writeAsset(resolve(GENERATED_ASSETS, 'favicon-48.png'), favicon48),
  ])

  console.log('[fyther-icons] generated adaptive icon family')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
