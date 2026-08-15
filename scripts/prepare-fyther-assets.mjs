import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WEBP_OPTIONS = { quality: 84, effort: 6, smartSubsample: true }

async function ensureOutputDirectory(output) {
  await mkdir(dirname(output), { recursive: true })
}

export async function prepareRaster(input, output, width, height, position = 'centre') {
  await ensureOutputDirectory(output)

  await sharp(input)
    .flatten({ background: '#000000' })
    .removeAlpha()
    .resize({ width, height, fit: 'cover', position })
    .webp(WEBP_OPTIONS)
    .toFile(output)
}

async function prepareHeroPoster(input, output, width, height) {
  const metadata = await sharp(input).metadata()
  const cropWidth = Math.floor((metadata.width ?? 0) * 0.875)
  const cropHeight = Math.round((cropWidth * 9) / 16)
  const left = Math.round(((metadata.width ?? cropWidth) - cropWidth) / 2)
  const croppedFrame = await sharp(input)
    .extract({ left, top: 0, width: cropWidth, height: cropHeight })
    .toBuffer()

  await prepareRaster(croppedFrame, output, width, height)
}

function sampleBackground(data, width, height, channels) {
  const inset = Math.max(1, Math.floor(Math.min(width, height) * 0.015))
  const points = [
    [inset, inset],
    [width - inset - 1, inset],
    [inset, height - inset - 1],
    [width - inset - 1, height - inset - 1],
  ]

  const total = points.reduce(
    (sum, [x, y]) => {
      const offset = (y * width + x) * channels
      sum[0] += data[offset]
      sum[1] += data[offset + 1]
      sum[2] += data[offset + 2]
      return sum
    },
    [0, 0, 0],
  )

  return total.map((channel) => channel / points.length)
}

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value))
  return clamped * clamped * (3 - 2 * clamped)
}

export async function prepareTransparentMark(input, output, size) {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const background = sampleBackground(data, info.width, info.height, info.channels)
  const rgba = Buffer.alloc(info.width * info.height * 4)

  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const sourceOffset = pixel * info.channels
    const outputOffset = pixel * 4
    const deltas = [
      Math.max(0, data[sourceOffset] - background[0]),
      Math.max(0, data[sourceOffset + 1] - background[1]),
      Math.max(0, data[sourceOffset + 2] - background[2]),
    ]
    const distance = Math.max(...deltas)
    const alpha = smoothstep((distance - 1.5) / 34)

    if (alpha === 0) {
      rgba[outputOffset] = 0
      rgba[outputOffset + 1] = 0
      rgba[outputOffset + 2] = 0
      rgba[outputOffset + 3] = 0
      continue
    }

    for (let channel = 0; channel < 3; channel += 1) {
      const unpremultiplied = background[channel] + deltas[channel] / alpha
      rgba[outputOffset + channel] = Math.round(Math.min(255, unpremultiplied))
    }
    rgba[outputOffset + 3] = Math.round(alpha * 255)
  }

  await ensureOutputDirectory(output)
  const padding = Math.round(size * 0.07)
  const innerSize = size - padding * 2

  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
    .resize({
      width: innerSize,
      height: innerSize,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ ...WEBP_OPTIONS, alphaQuality: 100 })
    .toFile(output)
}

async function main() {
  const publicPath = resolve(ROOT, 'public')
  const generatedPath = resolve(ROOT, '.superpowers/generated-assets')

  await Promise.all([
    prepareTransparentMark(
      resolve(publicPath, 'logo1.png'),
      resolve(publicPath, 'brand/fyther-mark-header.webp'),
      640,
    ),
    prepareTransparentMark(
      resolve(publicPath, 'logo2.png'),
      resolve(publicPath, 'brand/fyther-mark-footer.webp'),
      960,
    ),
    prepareHeroPoster(
      resolve(publicPath, 'home.jpeg'),
      resolve(publicPath, 'editorial/hero-poster-desktop.webp'),
      2400,
      1350,
    ),
    prepareRaster(
      resolve(publicPath, 'home.jpeg'),
      resolve(publicPath, 'editorial/hero-poster-mobile.webp'),
      1200,
      1500,
    ),
    prepareRaster(
      resolve(generatedPath, 'collection-ropa.png'),
      resolve(publicPath, 'editorial/collection-ropa.webp'),
      1600,
      2000,
    ),
    prepareRaster(
      resolve(generatedPath, 'collection-accesorios.png'),
      resolve(publicPath, 'editorial/collection-accesorios.webp'),
      1600,
      2000,
    ),
    prepareRaster(
      resolve(generatedPath, 'community-movement.png'),
      resolve(publicPath, 'editorial/community-movement.webp'),
      2000,
      1200,
    ),
    prepareRaster(
      resolve(generatedPath, 'footer-movement.png'),
      resolve(publicPath, 'editorial/footer-movement.webp'),
      1800,
      900,
    ),
  ])
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
