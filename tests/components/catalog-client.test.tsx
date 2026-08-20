import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CatalogClient from '@/app/catalogo/CatalogClient'
import type { CommerceProduct } from '@/lib/commerce/types'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

const products: CommerceProduct[] = [
  {
    id: 'legging-1',
    slug: 'legging-flujo',
    name: 'Legging Flujo',
    brand: 'Nike',
    shortDescription: 'Suave para moverte todo el día',
    description: null,
    price: { amount: 28900, currency: 'CRC' },
    compareAtPrice: { amount: 32900, currency: 'CRC' },
    images: [{ src: '/legging-flujo.jpg', alt: 'Legging Flujo' }],
    availability: 'in_stock',
    stockQuantity: 8,
    variants: [],
    category: 'Ropa',
    tags: [],
    featured: false,
  },
  {
    id: 'top-1',
    slug: 'top-brisa',
    name: 'Top Brisa',
    brand: 'Alo',
    shortDescription: 'Soporte ligero para compartir tu ritmo',
    description: null,
    price: { amount: 19900, currency: 'CRC' },
    compareAtPrice: null,
    images: [],
    availability: 'in_stock',
    stockQuantity: 5,
    variants: [],
    category: 'Accesórios',
    tags: ['Gym'],
    featured: true,
  },
]

function productList() {
  return screen.getByRole('list', { name: 'Productos' })
}

describe('CatalogClient', () => {
  it('starts in Todos and renders every live product', () => {
    render(<CatalogClient products={products} initialCategory="Todos" initialQuery="" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Encuentra algo para ti.' })).toBeInTheDocument()
    expect(screen.getByText('Ropa y accesorios elegidos para moverte y disfrutar cada día.')).toBeInTheDocument()
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
    render(<CatalogClient products={products} initialCategory="Todos" initialQuery="" />)

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'legging')

    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).queryByText('Top Brisa')).not.toBeInTheDocument()
    expect(screen.getByText('1 resultado')).toHaveAttribute('aria-live', 'polite')
  })

  it('matches product names without requiring Spanish diacritics', async () => {
    const user = userEvent.setup()
    const accentedProduct = {
      ...products[0],
      id: 'pantalon-1',
      slug: 'pantalon-flujo',
      name: 'Pantalón Flujo',
      brand: null,
    }
    render(<CatalogClient products={[accentedProduct]} initialCategory="Todos" initialQuery="" />)

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'pantalon')

    expect(within(productList()).getByText('Pantalón Flujo')).toBeInTheDocument()
    expect(screen.getByText('1 resultado')).toHaveAttribute('aria-live', 'polite')
  })

  it('searches actual brand metadata without changing product order', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" initialQuery="" />)

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'alo')

    expect(within(productList()).getByText('Alo')).toBeInTheDocument()
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
    expect(within(productList()).queryByText('Nike')).not.toBeInTheDocument()
    expect(within(productList()).queryByText('Legging Flujo')).not.toBeInTheDocument()
    expect(screen.getByText('1 resultado')).toHaveAttribute('aria-live', 'polite')
  })

  it('starts with a tag query from the URL', () => {
    render(<CatalogClient products={products} initialCategory="Accesorios" initialQuery="Gym" />)

    expect(screen.getByRole('button', { name: 'Accesorios' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('Gym')
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
    expect(within(productList()).queryByText('Legging Flujo')).not.toBeInTheDocument()
  })

  it('shows only the canonical category filters and normalizes category accents', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" initialQuery="" />)

    expect(screen.getAllByRole('button').filter((button) =>
      ['Todos', 'Ropa', 'Accesorios'].includes(button.textContent ?? ''),
    ).map((button) => button.textContent)).toEqual(['Todos', 'Ropa', 'Accesorios'])
    expect(screen.queryByRole('button', { name: 'Accesórios' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'top')
    await user.clear(screen.getByRole('textbox', { name: 'Buscar productos' }))
    await user.click(screen.getByRole('button', { name: 'Accesorios' }))

    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
    expect(within(productList()).queryByText('Legging Flujo')).not.toBeInTheDocument()
  })

  it('sorts visible products by price', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" initialQuery="" />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar productos' }), 'price-asc')

    const headings = within(productList()).getAllByRole('heading', { level: 3 })
    expect(headings.map((heading) => heading.textContent)).toEqual(['Top Brisa', 'Legging Flujo'])
  })

  it('recovers from no matches and restores the default catalog state', async () => {
    const user = userEvent.setup()
    render(<CatalogClient products={products} initialCategory="Todos" initialQuery="" />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar productos' }), 'price-desc')
    await user.click(screen.getByRole('button', { name: 'Ropa' }))
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

  it('keeps a valid empty Ropa category selected and hides accessory products', () => {
    render(<CatalogClient products={[products[1]]} initialCategory="Ropa" initialQuery="" />)

    expect(screen.getByRole('button', { name: 'Ropa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('0 resultados')).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByText('Top Brisa')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No encontramos esa combinación.' })).toBeInTheDocument()
  })

  it('falls back to Todos only for an unknown initial category', () => {
    render(<CatalogClient products={products} initialCategory="Calzado" initialQuery="" />)

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
  })

  it('synchronizes the query and selected category when URL-derived props change', async () => {
    const { rerender } = render(<CatalogClient products={products} initialCategory="Ropa" initialQuery="flujo" />)

    expect(screen.getByRole('button', { name: 'Ropa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('flujo')
    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).queryByText('Top Brisa')).not.toBeInTheDocument()

    rerender(<CatalogClient products={products} initialCategory="Accesorios" initialQuery="brisa" />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Accesorios' })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('brisa')
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
    expect(within(productList()).queryByText('Legging Flujo')).not.toBeInTheDocument()

    rerender(<CatalogClient products={products} initialCategory="Calzado" initialQuery="" />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('textbox', { name: 'Buscar productos' })).toHaveValue('')
    expect(within(productList()).getByText('Legging Flujo')).toBeInTheDocument()
    expect(within(productList()).getByText('Top Brisa')).toBeInTheDocument()
  })

  it('keeps filter touch targets and shape semantics stable', () => {
    expect(globalsCss).toMatch(/\.category-filters button\s*\{[^}]*min-height:\s*44px;[^}]*border-radius:\s*var\(--radius-control\)/)
    expect(globalsCss).toMatch(/\.search-control, \.sort-control\s*\{[^}]*min-height:\s*44px;[^}]*border-radius:\s*var\(--radius-panel\)/)
  })
})
