import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Next image origin configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('allows only Supabase storage paths on the exact configured HTTPS host', async () => {
    const configModule = await import('../next.config')
    const resolveRemoteImagePatterns = (configModule as unknown as {
      resolveRemoteImagePatterns?: (env: Record<string, string | undefined>) => Array<{
        protocol?: string
        hostname?: string
        pathname?: string
      }>
    }).resolveRemoteImagePatterns

    expect(resolveRemoteImagePatterns).toEqual(expect.any(Function))
    if (!resolveRemoteImagePatterns) return

    const patterns = resolveRemoteImagePatterns({
      NEXT_PUBLIC_SUPABASE_URL: 'https://tenant-ref.supabase.co',
    })
    expect(patterns).toEqual([{
      protocol: 'https',
      hostname: 'tenant-ref.supabase.co',
      pathname: '/storage/v1/object/**',
    }])
    expect(patterns.some(({ hostname }) => hostname === '**')).toBe(false)
    expect(patterns.some(({ hostname }) => hostname === 'images.example.com')).toBe(false)
  })

  it.each([
    ['missing URL', undefined],
    ['non-HTTPS URL', 'http://tenant-ref.supabase.co'],
    ['credentials', 'https://user:secret@tenant-ref.supabase.co'],
    ['unexpected API path', 'https://tenant-ref.supabase.co/rest/v1'],
    ['invalid URL', 'not-a-url'],
  ])('fails closed for %s', async (_label, value) => {
    const configModule = await import('../next.config')
    const resolveRemoteImagePatterns = (configModule as unknown as {
      resolveRemoteImagePatterns?: (env: Record<string, string | undefined>) => unknown[]
    }).resolveRemoteImagePatterns

    expect(resolveRemoteImagePatterns).toEqual(expect.any(Function))
    if (!resolveRemoteImagePatterns) return
    expect(resolveRemoteImagePatterns({ NEXT_PUBLIC_SUPABASE_URL: value })).toEqual([])
  })

  it('uses the same fail-closed resolver for the exported build configuration', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://build-ref.supabase.co')
    vi.resetModules()

    const { default: nextConfig } = await import('../next.config')

    expect(nextConfig.images?.remotePatterns).toEqual([{
      protocol: 'https',
      hostname: 'build-ref.supabase.co',
      pathname: '/storage/v1/object/**',
    }])
  })
})
