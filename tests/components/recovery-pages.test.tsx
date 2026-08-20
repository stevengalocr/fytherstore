import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorPage from '@/app/error'
import NotFound from '@/app/not-found'
import type { CommerceProduct } from '@/lib/commerce/types'

const getProducts = vi.hoisted(() => vi.fn())
const catalogProduct: CommerceProduct = {
  id: 'band-1',
  slug: 'banda-fuerza',
  name: 'Banda Fuerza',
  brand: null,
  shortDescription: 'Resistencia para entrenar',
  description: null,
  price: { amount: 9900, currency: 'CRC' },
  compareAtPrice: null,
  images: [],
  availability: 'in_stock',
  stockQuantity: 4,
  variants: [],
  category: 'Accesorios',
  tags: ['Gym'],
  featured: false,
}

vi.mock('@/lib/commerce', () => ({
  commerce: { getProducts },
  commerceMode: 'live',
}))

vi.mock('@/app/catalogo/CatalogClient', () => ({
  default: ({ initialCategory, initialQuery }: { initialCategory: string; initialQuery: string }) => (
    <div
      data-testid="catalog-client"
      data-initial-category={initialCategory}
      data-initial-query={initialQuery}
    />
  ),
}))

import CatalogPage from '@/app/catalogo/page'

describe('recovery pages', () => {
  beforeEach(() => {
    getProducts.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers a safe retry without rendering internal error details', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<ErrorPage error={new Error('private BilBildin endpoint and stack detail')} reset={reset} />)

    expect(container.querySelector('.status-surface')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'No pudimos abrir esta vista.', level: 1 })).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/bilbildin|supabase|endpoint|environment|entorno|configuraci[oó]n|service.role|stack|digest|cambios|devoluciones/i)
    const retryButton = screen.getByRole('button', { name: 'Intentar de nuevo' })
    expect(retryButton).toHaveClass('status-primary-action')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
    await user.click(retryButton)
    expect(reset).toHaveBeenCalledOnce()
  })

  it('returns missing routes to the collection', () => {
    const { container } = render(<NotFound />)

    expect(container.querySelector('.status-surface')).toBe(container.firstElementChild)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'No encontramos esta página.', level: 1 })).toBeInTheDocument()
    const collectionLink = screen.getByRole('link', { name: 'Ver la colección' })
    expect(collectionLink).toHaveClass('status-primary-action')
    expect(collectionLink).toHaveAttribute('href', '/catalogo')
    expect(container.querySelectorAll('.status-primary-action')).toHaveLength(1)
    expect(container).not.toHaveTextContent(/bilbildin|supabase|endpoint|environment|entorno|configuraci[oó]n|service.role|stack|digest|cambios|devoluciones/i)
  })

  it('uses the inclusive catalog lead when the live catalog is empty', async () => {
    getProducts.mockResolvedValue([])

    render(await CatalogPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText('Ropa y accesorios elegidos para moverte y disfrutar cada día.')).toBeInTheDocument()
    expect(screen.queryByText('Ropa activa para entrenar, caminar y compartir tu ritmo.')).not.toBeInTheDocument()
  })

  it('passes the first sanitized catalog filters to CatalogClient', async () => {
    getProducts.mockResolvedValue([catalogProduct])

    render(await CatalogPage({
      searchParams: Promise.resolve({ categoria: 'Accesorios', buscar: ['Gym', 'ignored'] }),
    }))

    expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-initial-category', 'Accesorios')
    expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-initial-query', 'Gym')
  })

  it('uses default catalog filters when URL parameters are omitted', async () => {
    getProducts.mockResolvedValue([catalogProduct])

    render(await CatalogPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-initial-category', 'Todos')
    expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-initial-query', '')
  })

  it('trims and caps the first value of each catalog filter', async () => {
    getProducts.mockResolvedValue([catalogProduct])
    const longQuery = 'g'.repeat(90)

    render(await CatalogPage({
      searchParams: Promise.resolve({
        categoria: [' Ropa ', 'Accesorios'],
        buscar: [` ${longQuery} `, 'ignored'],
      }),
    }))

    expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-initial-category', 'Ropa')
    expect(screen.getByTestId('catalog-client')).toHaveAttribute('data-initial-query', 'g'.repeat(80))
  })
})
