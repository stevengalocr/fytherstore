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

  it('uses five independent native disclosures for the factual service FAQ', () => {
    const { container } = render(<TrustFaq />)
    const scene = container.querySelector('#preguntas') as HTMLElement

    expect(scene).toBeInTheDocument()
    expect(within(scene).getByRole('heading', { name: 'Preguntas frecuentes', level: 2 })).toBeInTheDocument()
    expect(within(scene).queryByRole('list')).not.toBeInTheDocument()
    expect(scene.querySelector('.trust-chips')).not.toBeInTheDocument()

    const details = scene.querySelectorAll('details')
    const summaries = scene.querySelectorAll('summary')
    const chevrons = scene.querySelectorAll('summary svg.lucide-chevron-down')
    const answers = scene.querySelectorAll('.trust-faq-answer')
    expect(details).toHaveLength(5)
    expect(summaries).toHaveLength(5)
    expect(chevrons).toHaveLength(5)
    expect(answers).toHaveLength(5)
    expect(Array.from(chevrons).every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(Array.from(details).every((detail) => detail.querySelector(':scope > .trust-faq-answer > p'))).toBe(true)
    expect(Array.from(summaries, (summary) => summary.textContent)).toEqual([
      '¿Los productos son originales?',
      '¿Cómo realizan los envíos?',
      '¿Cuánto tardan en responder?',
      '¿Puedo apartar un producto?',
      '¿Cómo consulto mi pedido?',
    ])
    expect(Array.from(details).every((detail) => !detail.hasAttribute('open'))).toBe(true)

    expect(scene).toHaveTextContent(/productos seleccionados.*marcas reconocidas/i)
    expect(scene).toHaveTextContent(/Correos de Costa Rica/i)
    expect(scene).toHaveTextContent(/cobertura.*costo.*cada pedido/i)
    expect(scene).toHaveTextContent(/menos de 24 horas/i)
    expect(scene).toHaveTextContent(/apartados.*coordina.*antes de reservar/i)
    expect(scene).toHaveTextContent(/confirmación.*enlace único.*seguir tu pedido/i)
    expect(within(scene).getByRole('link', { name: /envíos y apartados/i })).toHaveAttribute('href', '/envios-apartados')
    expect(scene).not.toHaveTextContent(/cambios|devoluciones/i)
  })

})

describe('home commerce presentation', () => {
  it('presents two stable collection worlds and marks only unavailable Ropa as upcoming', () => {
    const { container } = render(
      <CollectionWorlds
        ropaAvailable={false}
        accesoriosAvailable
        accessoryTags={['Botellas', 'Gym & Viaje']}
      />,
    )

    expect(container.querySelector('section.collection-worlds')).toBeInTheDocument()
    expect(screen.getByText('EXPLORA')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Encuentra tu movimiento.' })).toBeInTheDocument()
    expect(screen.getByText('Dos formas de explorar piezas elegidas para acompañarte.')).toBeInTheDocument()

    const ropaLink = screen.getByRole('link', { name: 'Descubrir ropa' })
    const accesoriosLink = screen.getByRole('link', { name: 'Ver accesorios' })
    expect(container.querySelectorAll('a.collection-world-panel')).toHaveLength(2)
    expect(ropaLink).toHaveAttribute('href', '#ropa')
    expect(accesoriosLink).toHaveAttribute('href', '#accesorios')
    expect(ropaLink).toHaveAttribute('data-reveal')
    expect(accesoriosLink).toHaveAttribute('data-reveal')
    expect(within(ropaLink).getByText('Próximamente')).toBeInTheDocument()
    expect(within(accesoriosLink).queryByText('Próximamente')).not.toBeInTheDocument()
    expect(accesoriosLink.querySelector('.collection-world-status')).not.toBeInTheDocument()
    expect(ropaLink).toHaveAccessibleDescription('Próximamente')
    expect(accesoriosLink).not.toHaveAccessibleDescription('Próximamente')
    expect(ropaLink).toHaveAttribute('aria-describedby', 'collection-world-ropa-status')
    expect(accesoriosLink).not.toHaveAttribute('aria-describedby')

    expect(within(ropaLink).getByRole('img', { name: /selección editorial de ropa/i })).toHaveAttribute(
      'src',
      expect.stringContaining('collection-ropa'),
    )
    expect(within(accesoriosLink).getByRole('img', { name: /selección editorial de accesorios/i })).toHaveAttribute(
      'src',
      expect.stringContaining('collection-accesorios'),
    )
    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAttribute('sizes', '(max-width: 1024px) 82vw, 50vw')
    }
    expect(container.querySelectorAll('.collection-world-media')).toHaveLength(2)

    const filters = screen.getByRole('navigation', { name: 'Explorar accesorios por etiqueta' })
    expect(filters).toHaveClass('collection-world-filters')
    expect(within(filters).getAllByRole('link')).toHaveLength(2)
    expect(within(filters).getByRole('link', { name: 'Explorar accesorios con la etiqueta Botellas' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=Accesorios&buscar=Botellas',
    )
    expect(within(filters).getByRole('link', { name: 'Explorar accesorios con la etiqueta Gym & Viaje' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=Accesorios&buscar=Gym%20%26%20Viaje',
    )
  })

  it('marks only unavailable Accesorios as upcoming and gives both world links a direction icon', () => {
    render(<CollectionWorlds ropaAvailable accesoriosAvailable={false} accessoryTags={[]} />)

    const ropaLink = screen.getByRole('link', { name: 'Descubrir ropa' })
    const accesoriosLink = screen.getByRole('link', { name: 'Ver accesorios' })
    expect(within(ropaLink).queryByText('Próximamente')).not.toBeInTheDocument()
    expect(within(accesoriosLink).getByText('Próximamente')).toBeInTheDocument()
    expect(ropaLink.querySelector('.collection-world-status')).not.toBeInTheDocument()
    expect(ropaLink).not.toHaveAccessibleDescription('Próximamente')
    expect(accesoriosLink).toHaveAccessibleDescription('Próximamente')
    expect(ropaLink).not.toHaveAttribute('aria-describedby')
    expect(accesoriosLink).toHaveAttribute('aria-describedby', 'collection-world-accesorios-status')

    for (const link of [ropaLink, accesoriosLink]) {
      const icon = link.querySelector('svg.lucide-arrow-down-right')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('uses neutral statuses without unavailable descriptions when availability is unknown', () => {
    render(<CollectionWorlds ropaAvailable={null} accesoriosAvailable={null} accessoryTags={[]} />)

    const ropaLink = screen.getByRole('link', { name: 'Descubrir ropa' })
    const accesoriosLink = screen.getByRole('link', { name: 'Ver accesorios' })

    expect(within(ropaLink).getByText('Explorar')).toBeInTheDocument()
    expect(within(accesoriosLink).getByText('Explorar')).toBeInTheDocument()
    expect(screen.queryByText('Próximamente')).not.toBeInTheDocument()
    expect(ropaLink).not.toHaveAttribute('aria-describedby')
    expect(accesoriosLink).not.toHaveAttribute('aria-describedby')
    expect(ropaLink).not.toHaveAccessibleDescription()
    expect(accesoriosLink).not.toHaveAccessibleDescription()
  })

  it.each([
    ['zero', []],
    ['one', ['Gym']],
  ])('does not render accessory filters for %s tag', (_label, accessoryTags) => {
    const { container } = render(
      <CollectionWorlds ropaAvailable={false} accesoriosAvailable accessoryTags={accessoryTags} />,
    )

    expect(container.querySelector('.collection-world-filters')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Explorar accesorios por etiqueta' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Descubrir ropa' })).toHaveAccessibleDescription('Próximamente')
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

  it('features only the first card when Accesorios has at least three products', () => {
    const products = [
      product('uno', 'Accesorio Uno'),
      product('dos', 'Accesorio Dos'),
      product('tres', 'Accesorio Tres'),
      product('cuatro', 'Accesorio Cuatro'),
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
    const cardWrappers = section.querySelectorAll('.collection-product-card[data-reveal]')
    const featuredWrappers = section.querySelectorAll('.collection-product-card-featured')
    expect(cardWrappers).toHaveLength(4)
    expect(featuredWrappers).toHaveLength(1)
    expect(featuredWrappers[0]).toBe(cardWrappers[0])
    expect(cardWrappers[0]).toHaveClass('collection-product-card-featured')
    expect(cardWrappers[1]).not.toHaveClass('collection-product-card-featured')
    expect(cardWrappers[2]).not.toHaveClass('collection-product-card-featured')
    expect(cardWrappers[3]).not.toHaveClass('collection-product-card-featured')
    expect(Array.from(cardWrappers, (wrapper) => within(wrapper as HTMLElement).getByRole('heading').textContent)).toEqual([
      'Accesorio Uno',
      'Accesorio Dos',
      'Accesorio Tres',
      'Accesorio Cuatro',
    ])
    expect(within(section).getByRole('link', { name: 'Ver todos los accesorios' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=Accesorios',
    )
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
    expect(grid.querySelector('.collection-product-card-featured')).not.toBeInTheDocument()
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

  it('links a populated Ropa collection to the filtered catalog', () => {
    const { container } = render(
      <CollectionSection
        id="ropa"
        eyebrow="ROPA"
        title="Ropa para moverte contigo."
        description="Capas cómodas para todos tus ritmos."
        products={[
          product('ropa-uno', 'Ropa Uno'),
          product('ropa-dos', 'Ropa Dos'),
          product('ropa-tres', 'Ropa Tres'),
        ]}
        emptyTitle="La ropa viene en camino."
        emptyCopy="Estamos preparando esta selección para ti."
      />,
    )

    const section = container.querySelector('section#ropa') as HTMLElement
    expect(section.querySelectorAll('.collection-product-card')).toHaveLength(3)
    expect(section.querySelector('.collection-product-card-featured')).not.toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Ver toda la ropa' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=Ropa',
    )
  })
})
