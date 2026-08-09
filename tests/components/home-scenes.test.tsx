import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CollectionSection from '@/components/site/CollectionSection'
import CollectionWorlds from '@/components/site/CollectionWorlds'
import EditorialStory from '@/components/site/EditorialStory'
import TrustFaq from '@/components/site/TrustFaq'
import type { CommerceProduct } from '@/lib/commerce/types'

function product(id: string, name: string): CommerceProduct {
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
    category: 'Movimiento diario',
    tags: [],
    featured: false,
  }
}

describe('home scene contracts', () => {
  it('uses EditorialStory as a pure transition into the Fyther point of view', () => {
    const { container } = render(<EditorialStory />)

    expect(container.querySelector('.editorial-story')).toHaveAttribute('id', 'fyther')
    expect(screen.getByRole('img', { name: 'Mujer entrenando en un espacio de luz cyan y rosa' })).toHaveAttribute('src', expect.stringContaining('modelo1'))
    expect(screen.getByText('A TU MANERA')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tu rutina también vive en los detalles.' })).toBeInTheDocument()
    expect(screen.getByText('Lo que eliges para moverte puede sentirse cercano, útil y muy tuyo.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver la colección' })).not.toBeInTheDocument()
  })

  it('uses native disclosure controls and factual support links in TrustFaq', () => {
    const { container } = render(<TrustFaq />)
    const scene = container.querySelector('#preguntas')

    expect(scene).toBeInTheDocument()
    expect(scene).toHaveTextContent('Envíos claros')
    expect(scene).toHaveTextContent('Cambios con acompañamiento')
    expect(scene).toHaveTextContent('Soporte cercano')
    const trustList = within(scene as HTMLElement).getByRole('list', { name: 'Compromisos de servicio' })
    expect(within(trustList).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Preguntas, sin vueltas.' })).toBeInTheDocument()
    expect(scene?.querySelectorAll('details')).toHaveLength(3)
    expect(scene?.querySelectorAll('summary')).toHaveLength(3)
    const answers = scene?.querySelectorAll('details p')
    expect(answers?.[0].textContent).toBe('Productos, variantes, precios y disponibilidad se publican desde BilBildin.')
    expect(answers?.[1].textContent).toBe('La confirmación incluye un enlace único para seguir tu pedido.')
    expect(answers?.[2].textContent).toBe('Consulta nuestra información de envíos y cambios antes de comprar.')
    expect(within(scene as HTMLElement).getByRole('link', { name: /envíos y cambios/i })).toHaveAttribute('href', '/envios-cambios')
  })

})

describe('home commerce presentation', () => {
  it('presents two stable collection worlds and marks only unavailable Ropa as upcoming', () => {
    const { container } = render(<CollectionWorlds ropaAvailable={false} accesoriosAvailable />)

    expect(container.querySelector('section.collection-worlds')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dos formas de acompañar tu movimiento.' })).toBeInTheDocument()

    const ropaLink = screen.getByRole('link', { name: /descubrir ropa/i })
    const accesoriosLink = screen.getByRole('link', { name: /ver accesorios/i })
    expect(ropaLink).toHaveAttribute('href', '#ropa')
    expect(accesoriosLink).toHaveAttribute('href', '#accesorios')
    expect(ropaLink).toHaveAttribute('data-reveal')
    expect(accesoriosLink).toHaveAttribute('data-reveal')
    expect(within(ropaLink).getByText('Próximamente')).toBeInTheDocument()
    expect(within(accesoriosLink).queryByText('Próximamente')).not.toBeInTheDocument()

    expect(within(ropaLink).getByRole('img', { name: /ropa/i })).toHaveAttribute('src', expect.stringContaining('ropa'))
    expect(within(accesoriosLink).getByRole('img', { name: /accesorios/i })).toHaveAttribute('src', expect.stringContaining('modelo2'))
    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('sizes', '(max-width: 767px) calc(100vw - 32px), 50vw')
    }
    expect(container.querySelectorAll('.collection-world-media')).toHaveLength(2)
  })

  it('renders supplied empty Ropa messaging without products, prices, or a category link', () => {
    const { container } = render(
      <CollectionSection
        id="ropa"
        eyebrow="ROPA"
        title="Ropa para moverte contigo."
        description="Capas cómodas para todos tus ritmos."
        products={[]}
        emptyTitle="La ropa viene en camino."
        emptyCopy="Estamos preparando esta selección para ti."
      />,
    )

    const section = container.querySelector('section#ropa')
    expect(section).toHaveClass('collection-section')
    expect(section).toHaveAttribute('data-reveal')
    expect(within(section as HTMLElement).getByRole('heading', { name: 'Ropa para moverte contigo.' })).toBeInTheDocument()
    expect(within(section as HTMLElement).getByText('Capas cómodas para todos tus ritmos.')).toBeInTheDocument()
    const emptyState = section?.querySelector('.collection-empty') as HTMLElement
    expect(within(emptyState).getByRole('heading', { name: 'La ropa viene en camino.' })).toBeInTheDocument()
    expect(within(emptyState).getByText('Estamos preparando esta selección para ti.')).toBeInTheDocument()
    expect(within(section as HTMLElement).queryByRole('article')).not.toBeInTheDocument()
    expect(within(section as HTMLElement).queryByText(/₡/)).not.toBeInTheDocument()
    expect(within(section as HTMLElement).queryByRole('link', { name: 'Ver toda la ropa' })).not.toBeInTheDocument()
  })

  it('renders exactly the supplied Accesorios ProductCard articles and category action', () => {
    const products = [
      { ...product('uno', 'Accesorio Uno'), images: [{ src: '/uno.png', alt: 'Accesorio Uno en uso' }] },
      product('dos', 'Accesorio Dos'),
    ]
    const { container } = render(
      <CollectionSection
        id="accesorios"
        eyebrow="ACCESORIOS"
        title="Detalles que acompañan."
        description="Útiles, cercanos y tuyos."
        products={products}
        emptyTitle="Más detalles muy pronto."
        emptyCopy="Estamos preparando nuevos accesorios."
      />,
    )

    const section = container.querySelector('section#accesorios') as HTMLElement
    const grid = section.querySelector('.collection-product-grid') as HTMLElement
    const cardWrappers = grid.querySelectorAll('.collection-product-card[data-reveal]')
    const cards = within(grid).getAllByRole('article')
    expect(cards).toHaveLength(products.length)
    expect(cardWrappers).toHaveLength(products.length)
    expect(Array.from(cardWrappers).every((wrapper) => wrapper.querySelector(':scope > article.product-card'))).toBe(true)
    expect(within(grid).getByRole('heading', { name: 'Accesorio Uno' })).toBeInTheDocument()
    expect(within(grid).getByRole('heading', { name: 'Accesorio Dos' })).toBeInTheDocument()
    expect(within(section).queryByText('Más detalles muy pronto.')).not.toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Ver todos los accesorios' })).toHaveAttribute('href', '/catalogo?categoria=Accesorios')
    expect(within(grid).getByRole('img', { name: 'Accesorio Uno en uso' })).toHaveAttribute(
      'sizes',
      '(max-width: 767px) calc(100vw - 32px), (max-width: 1240px) 42vw, 500px',
    )
  })
})
