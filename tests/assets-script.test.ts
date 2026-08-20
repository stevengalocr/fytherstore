import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it, vi } from 'vitest'

type OptionalAssetResult = 'generated' | 'retained'
type PrepareOptionalAsset = (options: {
  input: string
  output: string
  width: number
  height: number
  label: string
  warn?: (message: string) => void
}) => Promise<OptionalAssetResult>

const roots: string[] = []

async function loadOptionalAssetPreparer(): Promise<PrepareOptionalAsset | undefined> {
  const assetScript = await import('../scripts/prepare-fyther-assets.mjs')
  return assetScript.prepareOptionalEditorialAsset as PrepareOptionalAsset | undefined
}

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), 'fyther-assets-test-'))
  roots.push(root)
  return root
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(roots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 50,
  })))
})

describe('clean-clone asset preparation', () => {
  it('retains and validates a committed editorial output when its ignored source is absent', async () => {
    const prepareOptionalEditorialAsset = await loadOptionalAssetPreparer()
    expect(prepareOptionalEditorialAsset).toEqual(expect.any(Function))
    if (!prepareOptionalEditorialAsset) return

    const root = await temporaryRoot()
    const output = join(root, 'public', 'editorial', 'collection.webp')
    await mkdir(join(root, 'public', 'editorial'), { recursive: true })
    await sharp({ create: { width: 40, height: 50, channels: 3, background: '#112233' } })
      .webp()
      .toFile(output)
    const before = await readFile(output)
    const warn = vi.fn()

    await expect(prepareOptionalEditorialAsset({
      input: join(root, '.superpowers', 'generated-assets', 'collection.png'),
      output,
      width: 40,
      height: 50,
      label: 'public/editorial/collection.webp',
      warn,
    })).resolves.toBe('retained')

    expect(await readFile(output)).toEqual(before)
    expect(warn).toHaveBeenCalledWith(
      '[fyther-assets] source unavailable; retained validated output public/editorial/collection.webp',
    )
  })

  it('regenerates an editorial output when the optional source is available', async () => {
    const prepareOptionalEditorialAsset = await loadOptionalAssetPreparer()
    expect(prepareOptionalEditorialAsset).toEqual(expect.any(Function))
    if (!prepareOptionalEditorialAsset) return

    const root = await temporaryRoot()
    const input = join(root, 'generated', 'collection.png')
    const output = join(root, 'public', 'editorial', 'collection.webp')
    await mkdir(join(root, 'generated'), { recursive: true })
    await sharp({ create: { width: 80, height: 80, channels: 3, background: '#abcdef' } })
      .png()
      .toFile(input)

    await expect(prepareOptionalEditorialAsset({
      input,
      output,
      width: 40,
      height: 50,
      label: 'public/editorial/collection.webp',
    })).resolves.toBe('generated')
    await expect(sharp(await readFile(output)).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 40,
      height: 50,
    })
  })

  it('fails clearly when neither an optional source nor a valid committed output exists', async () => {
    const prepareOptionalEditorialAsset = await loadOptionalAssetPreparer()
    expect(prepareOptionalEditorialAsset).toEqual(expect.any(Function))
    if (!prepareOptionalEditorialAsset) return

    const root = await temporaryRoot()
    await expect(prepareOptionalEditorialAsset({
      input: join(root, 'generated', 'missing.png'),
      output: join(root, 'public', 'editorial', 'missing.webp'),
      width: 40,
      height: 50,
      label: 'public/editorial/missing.webp',
    })).rejects.toThrow(
      '[fyther-assets] source unavailable and committed output is missing or invalid: public/editorial/missing.webp',
    )
  })

  it('documents the approved August 14 spec and clean-clone behavior', async () => {
    const readme = await readFile(resolve(process.cwd(), 'README.md'), 'utf8')

    expect(readme).toContain('docs/superpowers/specs/2026-08-14-fyther-soft-performance-redesign-design.md')
    expect(readme).toMatch(/clon limpio/i)
    expect(readme).toMatch(/conserva.*salidas editoriales/i)
  })
})
