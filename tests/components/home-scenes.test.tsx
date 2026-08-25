import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CollectionSection from '@/components/site/CollectionSection'
import CollectionWorlds from '@/components/site/CollectionWorlds'
import MotionTrack from '@/components/site/MotionTrack'
import SalesRail from '@/components/site/SalesRail'
import TrustFaq from '@/components/site/TrustFaq'
import type { CommerceProduct } from '@/lib/commerce/types'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

function product(id: string, name: string): CommerceProduct {
  return {
    id,
    slug: id,
    name,
    brand: null,
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
  it('renders the compact Fyther sales rail without imagery', () => {
    const { container } = render(<SalesRail />)

    const rail = container.querySelector('section.sales-rail') as HTMLElement
    expect(rail).toHaveAttribute('id', 'fyther')
    expect(rail).toHaveAttribute('data-reveal')
    expect(rail).toHaveAttribute('aria-labelledby', 'sales-rail-title')
    expect(within(rail).getByRole('heading', { level: 2, name: 'Tu próximo favorito ya está aquí.' })).toHaveAttribute(
      'id',
      'sales-rail-title',
    )
    expect(within(rail).getByText('Prendas y accesorios originales, con SINPE y opción de apartado.')).toBeInTheDocument()

    const cta = within(rail).getByRole('link', { name: 'Ver la colección' })
    expect(cta).toHaveAttribute('href', '/catalogo')
    expect(cta).toHaveClass('sales-rail-cta')
    expect(cta.querySelector('svg.lucide-arrow-up-right')).toHaveAttribute('aria-hidden', 'true')

    const ticker = rail.querySelector('.sales-ticker') as HTMLElement
    expect(ticker).toHaveAttribute('aria-hidden', 'true')
    const track = ticker.querySelector('.sales-ticker-track') as HTMLElement
    const groups = track.querySelectorAll(':scope > .sales-ticker-group')
    expect(groups).toHaveLength(2)
    for (const group of groups) {
      expect(Array.from(group.children, (item) => item.textContent)).toEqual([
        'Productos originales',
        'SINPE',
        'Apartados',
        'Correos de Costa Rica',
      ])
    }
    expect(rail.querySelector('img')).not.toBeInTheDocument()
  })

  it('defines a compact, responsive sales rail without obsolete editorial styles', () => {
    expect(globalsCss).toMatch(/\.sales-rail\s*\{[^}]*min-height:\s*112px;[^}]*overflow:\s*hidden/)
    expect(globalsCss).toMatch(/\.sales-rail-content\s*\{[^}]*min-width:\s*0;[^}]*display:\s*grid/)
    expect(globalsCss).toMatch(/\.sales-rail-copy\s*\{[^}]*min-width:\s*0;[^}]*display:\s*grid/)
    expect(globalsCss).toMatch(/\.sales-rail-cta\s*\{[^}]*min-height:\s*44px;[^}]*border-radius:\s*var\(--radius-control\)/)
    expect(globalsCss).toMatch(/\.sales-rail-cta:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-cyan\);[^}]*outline-offset:/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*767px\)[\s\S]*?\.sales-rail\s*\{[^}]*min-height:\s*144px/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*767px\)[\s\S]*?\.sales-rail-copy\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*?\.sales-rail-content\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*?\.sales-rail-cta\s*\{[^}]*width:\s*100%/)
    expect(globalsCss).not.toContain('.editorial-story')
  })

  it('keeps the ticker contained and honors both motion preferences', () => {
    expect(globalsCss).toMatch(/\.sales-ticker\s*\{[^}]*width:\s*100%;[^}]*overflow:\s*hidden/)
    expect(globalsCss).toMatch(/\.sales-ticker-track\s*\{[^}]*width:\s*max-content/)
    expect(globalsCss).toMatch(/\.sales-ticker-group\s*\{[^}]*flex-shrink:\s*0/)
    expect(globalsCss).toMatch(/\.sales-ticker-item\s*\{[^}]*font-size:\s*(?:0\.7[2-9]|0\.8)rem/)
    expect(globalsCss).toMatch(/\.sales-ticker-item::before\s*\{[^}]*background:\s*var\(--color-cyan\)/)
    expect(globalsCss).toMatch(/\.sales-ticker-item:nth-child\(even\)::before\s*\{[^}]*background:\s*var\(--color-pink\)/)
    expect(globalsCss).toMatch(/@media \(prefers-reduced-motion:\s*no-preference\)[\s\S]*?\.sales-ticker-track\s*\{[^}]*animation:\s*sales-ticker-scroll\s+28s\s+linear\s+infinite/)
    expect(globalsCss).toMatch(/@keyframes\s+sales-ticker-scroll\s*\{\s*to\s*\{[^}]*transform:\s*translate3d\(-50%,\s*0,\s*0\);[^}]*\}\s*\}/)
    expect(globalsCss).toMatch(/\.sales-rail:hover \.sales-ticker-track,\s*\.sales-rail:focus-within \.sales-ticker-track\s*\{[^}]*animation-play-state:\s*paused/)
    expect(globalsCss).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.sales-ticker-track\s*\{[^}]*animation:\s*none\s*!important;[^}]*transform:\s*none\s*!important/)
    expect(globalsCss).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.sales-ticker-group:nth-child\(2\)\s*\{[^}]*display:\s*none/)
  })

  it('uses five native disclosures for the factual service FAQ', async () => {
    const user = userEvent.setup()
    const { container } = render(<TrustFaq />)
    const scene = container.querySelector('#preguntas') as HTMLElement

    expect(scene).toBeInTheDocument()
    expect(within(scene).getByRole('heading', { name: 'Preguntas frecuentes', level: 2 })).toBeInTheDocument()
    expect(within(scene).queryByRole('list')).not.toBeInTheDocument()
    expect(scene.querySelector('.trust-chips')).not.toBeInTheDocument()

    const questions = Array.from(scene.querySelectorAll('summary'))
    const disclosures = Array.from(scene.querySelectorAll('details'))
    const chevrons = scene.querySelectorAll('summary svg.lucide-chevron-down')
    expect(questions).toHaveLength(5)
    expect(disclosures).toHaveLength(5)
    expect(disclosures.every((details) => details.getAttribute('name') === 'fyther-faq')).toBe(true)
    expect(chevrons).toHaveLength(5)
    expect(Array.from(chevrons).every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(questions.map((question) => question.textContent)).toEqual([
      '¿Los productos son originales?',
      '¿Cómo realizan los envíos?',
      '¿Cuánto tardan en responder?',
      '¿Puedo apartar un producto?',
      '¿Cómo consulto mi pedido?',
    ])
    expect(disclosures.every((details) => !details.open)).toBe(true)

    const answerPatterns = [
      /productos.*originales.*marcas reconocidas/i,
      /Correos de Costa Rica.*cobertura.*costo.*cada pedido/i,
      /consultas.*confirmamos pedidos.*menos de 24 horas/i,
      /apartados.*coordinan directamente.*antes de reservar/i,
      /confirmación.*enlace único.*seguimiento.*pedido/i,
    ]
    for (const [index, question] of questions.entries()) {
      await user.click(question)
      expect(disclosures[index]).toHaveAttribute('open')
      expect(disclosures[index]).toHaveTextContent(answerPatterns[index])
      await user.click(question)
    }
    await user.click(questions[1])
    expect(within(scene).getByRole('link', { name: /envíos y apartados/i })).toHaveAttribute('href', '/envios-apartados')
    expect(scene).not.toHaveTextContent(/cambios|devoluciones/i)
  })

  it('renders four stable service items without a marquee track', () => {
    const { container } = render(<MotionTrack />)

    const list = screen.getByRole('list', { name: 'Compromisos Fyther' })
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'ORIGINALES',
      'CORREOS DE COSTA RICA',
      'APARTADOS',
      'RESPUESTA EN MENOS DE 24H',
    ])
    expect(container.querySelector('[class*="marquee"]')).not.toBeInTheDocument()
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

    const ropaImage = within(ropaLink).getByRole('img', { name: /selección editorial de ropa/i })
    const accesoriosImage = within(accesoriosLink).getByRole('img', { name: /selección editorial de accesorios/i })
    expect(decodeURIComponent(ropaImage.getAttribute('src') ?? '')).toContain('/editorial/collection-ropa.webp')
    expect(decodeURIComponent(accesoriosImage.getAttribute('src') ?? '')).toContain('/editorial/collection-accesorios.webp')
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
    expect(within(section as HTMLElement).queryByRole('link', { name: /^Ver producto / })).not.toBeInTheDocument()
    expect(within(section as HTMLElement).queryByText(/₡/)).not.toBeInTheDocument()
    expect(within(section as HTMLElement).queryByRole('link', { name: 'Ver toda la ropa' })).not.toBeInTheDocument()
  })

  it('keeps four supplied products in order inside the native rail with the category link outside', () => {
    const products = [
      { ...product('uno', 'Accesorio Uno'), images: [{ src: '/uno.png', alt: 'Accesorio Uno en uso' }] },
      { ...product('dos', 'Accesorio Dos'), images: [{ src: '/dos.png', alt: 'Accesorio Dos en uso' }] },
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
    const rail = section.querySelector('.collection-product-rail') as HTMLElement
    const cardWrappers = rail.querySelectorAll(':scope > .collection-product-card[data-reveal]')
    expect(cardWrappers).toHaveLength(4)
    expect(within(cardWrappers[0] as HTMLElement).getByRole('img', { name: 'Accesorio Uno en uso' })).toHaveAttribute(
      'sizes',
      '(max-width: 560px) 72vw, (max-width: 900px) 48vw, (max-width: 1240px) 31vw, 25vw',
    )
    expect(within(cardWrappers[1] as HTMLElement).getByRole('img', { name: 'Accesorio Dos en uso' })).toHaveAttribute(
      'sizes',
      '(max-width: 560px) 72vw, (max-width: 900px) 48vw, (max-width: 1240px) 31vw, 25vw',
    )
    expect(Array.from(cardWrappers, (wrapper) => within(wrapper as HTMLElement).getByRole('heading').textContent)).toEqual([
      'Accesorio Uno',
      'Accesorio Dos',
      'Accesorio Tres',
      'Accesorio Cuatro',
    ])
    const categoryLink = within(section).getByRole('link', { name: 'Ver todos los accesorios' })
    expect(categoryLink).toHaveAttribute(
      'href',
      '/catalogo?categoria=Accesorios',
    )
    expect(rail).not.toContainElement(categoryLink)
  })

  it('renders exactly the supplied Accesorios ProductCard links and category action', () => {
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
    const rail = section.querySelector('.collection-product-rail') as HTMLElement
    const cardWrappers = rail.querySelectorAll('.collection-product-card[data-reveal]')
    const cards = within(rail).getAllByRole('link', { name: /^Ver producto / })
    expect(cards).toHaveLength(products.length)
    expect(cards.map((card) => card.getAttribute('href'))).toEqual(['/catalogo/uno', '/catalogo/dos'])
    expect(cards.every((card) => card.classList.contains('product-card'))).toBe(true)
    expect(cards.every((card) => card.querySelector('a, button, input, select, textarea') === null)).toBe(true)
    expect(cardWrappers).toHaveLength(products.length)
    expect(rail.querySelector('.collection-product-card-featured')).not.toBeInTheDocument()
    expect(Array.from(cardWrappers).every((wrapper) => wrapper.querySelector(':scope > a.product-card'))).toBe(true)
    expect(within(rail).getByRole('heading', { name: 'Accesorio Uno' })).toBeInTheDocument()
    expect(within(rail).getByRole('heading', { name: 'Accesorio Dos' })).toBeInTheDocument()
    expect(within(section).queryByText('Más detalles muy pronto.')).not.toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Ver todos los accesorios' })).toHaveAttribute('href', '/catalogo?categoria=Accesorios')
    expect(within(rail).getByRole('img', { name: 'Accesorio Uno en uso' })).toHaveAttribute(
      'sizes',
      '(max-width: 560px) 72vw, (max-width: 900px) 48vw, (max-width: 1240px) 31vw, 25vw',
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

  it('defines compact category worlds, a four-three-two product grid, and a native mobile rail', () => {
    const mobileCss = globalsCss.match(/@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    const smallMobileCss = globalsCss.match(/@media \(max-width: 560px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(globalsCss).toMatch(/\.collection-product-rail\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(4,/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*1240px\)[\s\S]*?\.collection-product-rail\s*\{[^}]*grid-template-columns:\s*repeat\(3,/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*900px\)[\s\S]*?\.collection-product-rail\s*\{[^}]*grid-template-columns:\s*repeat\(2,/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*?\.collection-product-rail\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*inline mandatory/)
    expect(globalsCss).toMatch(/@media \(max-width:\s*560px\)[\s\S]*?\.collection-product-card\s*\{[^}]*flex:\s*0 0 72%;[^}]*scroll-snap-align:\s*start/)
    expect(globalsCss).toMatch(/\.collection-world-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10/)
    expect(globalsCss).not.toMatch(/@media \(max-width:\s*1024px\)[\s\S]*?\.collection-world-grid\s*\{[^}]*display:\s*flex/)
    expect(smallMobileCss).toMatch(/\.collection-world-grid\s*\{[^}]*gap:\s*0\.75rem/)
    expect(smallMobileCss).toMatch(/\.collection-world-copy\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/)
    expect(globalsCss).toMatch(/\.collection-world-panel:first-child \.collection-world-media\s*\{[^}]*border-radius:\s*var\(--radius-editorial\) var\(--radius-editorial-tight\) var\(--radius-editorial\) var\(--radius-editorial\)/)
    expect(globalsCss).toMatch(/\.collection-world-panel:last-child \.collection-world-media\s*\{[^}]*border-radius:\s*var\(--radius-editorial-tight\) var\(--radius-editorial\) var\(--radius-editorial\) var\(--radius-editorial\)/)
    expect(mobileCss).toMatch(/\.collection-world-panel:first-child \.collection-world-media,[\s\S]*?\.collection-world-panel:last-child \.collection-world-media\s*\{[^}]*border-radius:\s*var\(--radius-editorial\)/)
  })
})
