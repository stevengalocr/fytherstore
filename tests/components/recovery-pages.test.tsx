import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorPage from '@/app/error'
import NotFound from '@/app/not-found'

const getProducts = vi.hoisted(() => vi.fn())

vi.mock('@/lib/commerce', () => ({
  commerce: { getProducts },
  commerceMode: 'live',
}))

import CatalogPage from '@/app/catalogo/page'

describe('recovery pages', () => {
  beforeEach(() => getProducts.mockReset())

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers a safe retry without rendering internal error details', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<ErrorPage error={new Error('private integration detail')} reset={reset} />)

    expect(screen.getByRole('heading', { name: 'No pudimos abrir esta vista.', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText(/private integration detail/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('returns missing routes to the collection', () => {
    render(<NotFound />)

    expect(screen.getByRole('heading', { name: 'No encontramos esta página.', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
  })

  it('uses the inclusive catalog lead when the live catalog is empty', async () => {
    getProducts.mockResolvedValue([])

    render(await CatalogPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText('Ropa y accesorios elegidos para moverte y disfrutar cada día.')).toBeInTheDocument()
    expect(screen.queryByText('Ropa activa para entrenar, caminar y compartir tu ritmo.')).not.toBeInTheDocument()
  })
})
