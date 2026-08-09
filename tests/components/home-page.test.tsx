import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommerceProduct } from '@/lib/commerce/types'

const getProducts = vi.hoisted(() => vi.fn())

vi.mock('@/lib/commerce', () => ({
  commerce: { getProducts },
  commerceMode: 'live',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import HomePage from '@/app/page'

function product(id: string, name: string, category: string): CommerceProduct {
  return {
    id,
    slug: id,
    name,
    shortDescription: null,
    description: null,
    price: { amount: 15000, currency: 'CRC' },
    compareAtPrice: null,
    images: [],
    availability: 'in_stock',
    stockQuantity: 3,
    variants: [],
    category,
    tags: [],
    featured: false,
  }
}

function sceneOrder(container: HTMLElement) {
  return Array.from(container.children).map((element) => element.id || element.classList[0])
}

describe('HomePage', () => {
  beforeEach(() => {
    getProducts.mockReset()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('splits exact worlds and renders the requested anchored scene order', async () => {
    getProducts.mockResolvedValue([
      product('ropa-real', 'Ropa Real', 'Ropa'),
      product('accesorio-real', 'Accesorio Real', 'Accesórios'),
      product('calzado', 'Calzado Ignorado', 'Calzado'),
    ])

    const { container } = render(await HomePage())
    const ropa = container.querySelector('section#ropa') as HTMLElement
    const accesorios = container.querySelector('section#accesorios') as HTMLElement

    expect(sceneOrder(container)).toEqual([
      'descubrir',
      'current-rail',
      'collection-worlds',
      'ropa',
      'fyther',
      'accesorios',
      'preguntas',
    ])
    expect(within(ropa).getByRole('heading', { name: 'Ropa para sentirte tú.' })).toBeInTheDocument()
    expect(within(ropa).getByText('Prendas elegidas para entrenar, caminar y compartir tu ritmo.')).toBeInTheDocument()
    expect(within(ropa).getByRole('heading', { name: 'Ropa Real' })).toBeInTheDocument()
    expect(within(ropa).queryByText('Accesorio Real')).not.toBeInTheDocument()
    expect(within(accesorios).getByRole('heading', { name: 'Detalles que siguen tu ritmo.' })).toBeInTheDocument()
    expect(within(accesorios).getByText('Accesorios originales y útiles para organizar, celebrar y acompañar cada meta.')).toBeInTheDocument()
    expect(within(accesorios).getByRole('heading', { name: 'Accesorio Real' })).toBeInTheDocument()
    expect(within(accesorios).queryByText('Ropa Real')).not.toBeInTheDocument()
    expect(screen.queryByText('Calzado Ignorado')).not.toBeInTheDocument()
  })

  it('renders both honest collection empty states after a successful empty response', async () => {
    getProducts.mockResolvedValue([])

    const { container } = render(await HomePage())
    const ropa = container.querySelector('section#ropa') as HTMLElement
    const accesorios = container.querySelector('section#accesorios') as HTMLElement

    expect(sceneOrder(container)).toEqual([
      'descubrir',
      'current-rail',
      'collection-worlds',
      'ropa',
      'fyther',
      'accesorios',
      'preguntas',
    ])
    expect(within(ropa).getByRole('heading', { name: 'Estamos preparando esta selección.' })).toBeInTheDocument()
    expect(within(ropa).getByText('Muy pronto encontrarás prendas elegidas para moverte a tu manera.')).toBeInTheDocument()
    expect(within(accesorios).getByRole('heading', { name: 'Estamos preparando los detalles.' })).toBeInTheDocument()
    expect(within(accesorios).getByText('La selección de accesorios estará disponible pronto.')).toBeInTheDocument()
    expect(container.querySelector('.commerce-state')).not.toBeInTheDocument()
    expect(screen.getAllByText('Próximamente')).toHaveLength(2)
  })

  it('renders one error state and no collection sections when commerce fails', async () => {
    getProducts.mockRejectedValue(new Error('offline'))

    const { container } = render(await HomePage())

    expect(container.querySelectorAll('section.collection-section')).toHaveLength(0)
    expect(container.querySelectorAll('section.commerce-state')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar la colección.')
    expect(screen.getAllByText('Próximamente')).toHaveLength(2)
    expect(sceneOrder(container)).toEqual([
      'descubrir',
      'current-rail',
      'collection-worlds',
      'commerce-state',
      'fyther',
      'preguntas',
    ])
  })
})
