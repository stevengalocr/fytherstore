import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CatalogClient from '@/app/catalogo/CatalogClient'
import type { CommerceProduct } from '@/lib/commerce/types'

const products: CommerceProduct[] = [
  {
    id: 'legging-1',
    slug: 'legging-flujo',
    name: 'Legging Flujo',
    shortDescription: 'Suave para moverte todo el día',
    description: null,
    price: { amount: 28900, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/legging-flujo.jpg', alt: 'Legging Flujo' }],
    availability: 'in_stock',
    stockQuantity: 8,
    variants: [],
    category: 'Leggings',
    tags: [],
    featured: false,
  },
  {
    id: 'top-1',
    slug: 'top-brisa',
    name: 'Top Brisa',
    shortDescription: 'Soporte ligero para compartir tu ritmo',
    description: null,
    price: { amount: 19900, currency: 'CRC' },
    compareAtPrice: null,
    images: [],
    availability: 'in_stock',
    stockQuantity: 5,
    variants: [],
    category: 'Tops',
    tags: [],
    featured: true,
  },
]

function productList() {
  return screen.getByRole('list', { name: 'Productos' })
}

describe('CatalogClient', () => {
  it('starts in Todos and renders every live product', () => {
    render(<CatalogClient products={products} initialCategory="Todos" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Encuentra algo para ti.' })).toBeInTheDocument()
    expect(screen.getByText('Ropa activa para entrenar, caminar y compartir tu ritmo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
    expect(within(productList()).getByRole('img', { name: 'Legging Flujo' })).toHaveAttribute(
      'sizes',
      '(max-width: 560px) calc(100vw - 32px), (max-width: 1100px) calc(50vw - 32px), 380px',
    )
    expect(screen.getByText('2 resultados')).toHaveAttribute('aria-live', 'polite')
  })

  it('searches by product name', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" />)

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'legging')

    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).queryByText('Top Brisa')).not.toBeInTheDocument()
    expect(screen.getByText('1 resultado')).toHaveAttribute('aria-live', 'polite')
  })

  it('derives category filters from live products and filters by category', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" />)

    expect(screen.getByRole('button', { name: 'Leggings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tops' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accesorios' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'top')
    await user.clear(screen.getByRole('textbox', { name: 'Buscar productos' }))
    await user.click(screen.getByRole('button', { name: 'Tops' }))

    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
    expect(within(productList()).queryByText('Legging Flujo')).not.toBeInTheDocument()
  })

  it('sorts visible products by price', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar productos' }), 'price-asc')

    const headings = within(productList()).getAllByRole('heading', { level: 3 })
    expect(headings.map((heading) => heading.textContent)).toEqual(['Top Brisa', 'Legging Flujo'])
  })

  it('recovers from no matches and restores the default catalog state', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar productos' }), 'price-desc')
    await user.click(screen.getByRole('button', { name: 'Leggings' }))
    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'brisa')

    expect(screen.getByRole('heading', { name: 'No encontramos esa combinación.' })).toBeInTheDocument()
    expect(screen.getByText('0 resultados')).toHaveAttribute('aria-live', 'polite')

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Ordenar productos' })).toHaveValue('featured')
    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
  })

  it('resets a removed category to Todos when live products change', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CatalogClient products={products} initialCategory="Todos" />)

    await user.click(screen.getByRole('button', { name: 'Tops' }))
    expect(screen.getByRole('button', { name: 'Tops' })).toHaveAttribute('aria-pressed', 'true')

    rerender(<CatalogClient products={[products[0]]} initialCategory="Todos" />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.queryByRole('button', { name: 'Tops' })).not.toBeInTheDocument()
    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()

    rerender(<CatalogClient products={products} initialCategory="Todos" />)

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tops' })).toHaveAttribute('aria-pressed', 'false')
  })
})
