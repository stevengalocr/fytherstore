import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductPage, { generateMetadata } from '@/app/catalogo/[slug]/page'

const mocks = vi.hoisted(() => ({
  getProductBySlug: vi.fn(),
  notFound: vi.fn(),
}))

vi.mock('@/lib/commerce', () => ({
  commerce: { getProductBySlug: mocks.getProductBySlug },
}))

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}))

describe('product page lookup outcomes', () => {
  const missing = new Error('NEXT_HTTP_ERROR_FALLBACK;404')

  beforeEach(() => {
    mocks.getProductBySlug.mockReset()
    mocks.notFound.mockReset()
    mocks.notFound.mockImplementation(() => { throw missing })
  })

  it('uses notFound only when the product does not exist', async () => {
    mocks.getProductBySlug.mockResolvedValue(null)

    await expect(ProductPage({ params: Promise.resolve({ slug: 'ausente' }) })).rejects.toBe(missing)
    expect(mocks.notFound).toHaveBeenCalledOnce()
  })

  it('lets product query failures reach the error boundary', async () => {
    const failure = new Error('catalog query unavailable')
    mocks.getProductBySlug.mockRejectedValue(failure)

    await expect(ProductPage({ params: Promise.resolve({ slug: 'legging-flujo' }) })).rejects.toBe(failure)
    expect(mocks.notFound).not.toHaveBeenCalled()
  })

  it('does not hide metadata query failures as a generic product', async () => {
    const failure = new Error('metadata query unavailable')
    mocks.getProductBySlug.mockRejectedValue(failure)

    await expect(generateMetadata({ params: Promise.resolve({ slug: 'legging-flujo' }) })).rejects.toBe(failure)
  })
})
