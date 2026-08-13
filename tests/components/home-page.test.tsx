import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommerceProduct } from '@/lib/commerce/types'

const commerceMock = vi.hoisted(() => ({
  getProducts: vi.fn(),
  mode: 'live' as 'live' | 'unconfigured',
}))

vi.mock('@/lib/commerce', () => ({
  commerce: { getProducts: commerceMock.getProducts },
  get commerceMode() { return commerceMock.mode },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import HomePage from '@/app/page'

function product(id: string, name: string, category: string, tags: string[] = []): CommerceProduct {
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
    tags,
    featured: false,
  }
}

function sceneOrder(container: HTMLElement) {
  return Array.from(container.children).map((element) => element.id || element.classList[0])
}

describe('HomePage', () => {
  beforeEach(() => {
    commerceMock.getProducts.mockReset()
    commerceMock.mode = 'live'
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('splits exact worlds and renders the requested anchored scene order', async () => {
    commerceMock.getProducts.mockResolvedValue([
      product('ropa-real', 'Ropa Real', 'Ropa', ['Leggings', 'Training']),
      product('accesorio-real', 'Accesorio Real', 'Accesórios', ['Botellas', 'Gym']),
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
    expect(screen.getByRole('heading', { name: 'Encuentra tu movimiento.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar accesorios con la etiqueta Botellas' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=Accesorios&buscar=Botellas',
    )
    expect(screen.getByRole('link', { name: 'Explorar accesorios con la etiqueta Gym' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=Accesorios&buscar=Gym',
    )
    expect(screen.queryByRole('link', { name: 'Explorar accesorios con la etiqueta Leggings' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Explorar accesorios con la etiqueta Training' })).not.toBeInTheDocument()
    expect(within(ropa).getByRole('heading', { name: 'Ropa para sentirte tú.' })).toBeInTheDocument()
    expect(within(ropa).getByText('Prendas elegidas para entrenar, caminar y compartir tu ritmo.')).toBeInTheDocument()
    expect(within(ropa).getByRole('heading', { name: 'Ropa Real' })).toBeInTheDocument()
    expect(within(ropa).queryByText('Accesorio Real')).not.toBeInTheDocument()
    expect(within(accesorios).getByText('SELECCIÓN ACTUAL')).toBeInTheDocument()
    expect(within(accesorios).getByRole('heading', { name: 'Lo que se está llevando.' })).toBeInTheDocument()
    expect(within(accesorios).getByText('Accesorios originales y útiles para organizar, celebrar y acompañar cada meta.')).toBeInTheDocument()
    expect(within(accesorios).getByRole('heading', { name: 'Accesorio Real' })).toBeInTheDocument()
    expect(within(accesorios).queryByText('Ropa Real')).not.toBeInTheDocument()
    expect(screen.queryByText('Calzado Ignorado')).not.toBeInTheDocument()
  })

  it('renders both honest collection empty states after a successful empty response', async () => {
    commerceMock.getProducts.mockResolvedValue([])

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
    expect(container.querySelectorAll('section.collection-section')).toHaveLength(2)
    expect(screen.getAllByText('Próximamente')).toHaveLength(2)
  })

  it('keeps truthful anchors and unknown world statuses when commerce fails', async () => {
    commerceMock.getProducts.mockRejectedValue(new Error('offline'))

    const { container } = render(await HomePage())

    expect(container.querySelectorAll('#ropa')).toHaveLength(1)
    expect(container.querySelectorAll('#accesorios')).toHaveLength(1)
    expect(container.querySelectorAll('section.collection-section')).toHaveLength(0)
    expect(container.querySelectorAll('section.commerce-state')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar la colección.')
    expect(screen.queryByText('Próximamente')).not.toBeInTheDocument()
    expect(screen.getAllByText('Explorar')).toHaveLength(2)
  })

  it('keeps truthful anchors and one preparing state when commerce is unconfigured', async () => {
    commerceMock.mode = 'unconfigured'
    commerceMock.getProducts.mockResolvedValue([
      product('accesorio-tagged', 'Accesorio Tagged', 'Accesorios', ['Botellas', 'Gym']),
    ])

    const { container } = render(await HomePage())

    expect(container.querySelectorAll('#ropa')).toHaveLength(1)
    expect(container.querySelectorAll('#accesorios')).toHaveLength(1)
    expect(container.querySelectorAll('section.collection-section')).toHaveLength(0)
    expect(container.querySelectorAll('section.commerce-state')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Estamos preparando la colección.' })).toBeInTheDocument()
    expect(screen.queryByText('Próximamente')).not.toBeInTheDocument()
    expect(screen.getAllByText('Explorar')).toHaveLength(2)
    expect(container.querySelector('.collection-world-filters')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Explorar accesorios con la etiqueta Botellas' })).not.toBeInTheDocument()
  })
})
