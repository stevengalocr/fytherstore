import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CategoryRail from '@/components/site/CategoryRail'
import EditorialStory from '@/components/site/EditorialStory'
import FinalGlow from '@/components/site/FinalGlow'
import TrustFaq from '@/components/site/TrustFaq'
import WhyFyther from '@/components/site/WhyFyther'
import ProductGrid from '@/components/commerce/ProductGrid'
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
  it('presents the three Fyther values in the anchored why scene', () => {
    const { container } = render(<WhyFyther />)
    const scene = container.querySelector('#fyther')

    expect(scene).toBeInTheDocument()
    expect(scene).toHaveTextContent('POR QUÉ FYTHER')
    expect(scene).toHaveTextContent('Elegimos con intención.')
    expect(scene).toHaveTextContent('Calidad seleccionada')
    expect(scene).toHaveTextContent('Originalidad verificable')
    expect(scene).toHaveTextContent('Lista para moverte')
  })

  it('uses the approved campaign image and collection action in EditorialStory', () => {
    render(<EditorialStory />)

    expect(screen.getByRole('img', { name: 'Mujer entrenando en un espacio de luz cyan y rosa' })).toHaveAttribute('src', expect.stringContaining('modelo1'))
    expect(screen.getByRole('heading', { name: 'Sentirte bien también cuenta.' })).toBeInTheDocument()
    expect(screen.getByText('Prendas para acompañar tu rutina sin dictarla.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
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

  it('closes with the alternate official mark and collection action', () => {
    const { container } = render(<FinalGlow />)

    expect(container.querySelector('[data-variant="alternate"] img')).toHaveAttribute('src', expect.stringContaining('logo2'))
    expect(container.querySelector('[data-variant="alternate"] img')).toHaveAttribute('sizes', '(max-width: 767px) 220px, 280px')
    expect(screen.getByRole('heading', { name: 'Lo que sigue, a tu manera.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveClass('button', 'button-primary')
  })
})

describe('home commerce presentation', () => {
  it('omits the category scene when no live categories exist', () => {
    const { container } = render(<CategoryRail categories={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('links category exploration with encoded live category values', () => {
    render(<CategoryRail categories={['Yoga & movilidad', 'Running']} />)

    expect(screen.getByRole('heading', { name: 'Encuentra tu movimiento.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explorar la categoría yoga & movilidad/i })).toHaveAttribute('href', '/catalogo?categoria=Yoga%20%26%20movilidad')
    expect(screen.getByRole('link', { name: /explorar la categoría running/i })).toHaveAttribute('href', '/catalogo?categoria=Running')
  })

  it('renders exactly the supplied products under the default title', () => {
    render(<ProductGrid products={[product('uno', 'Producto Uno'), product('dos', 'Producto Dos')]} />)

    expect(screen.getByRole('heading', { name: 'Una selección para ti.' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText('Producto Uno')).toBeInTheDocument()
    expect(screen.getByText('Producto Dos')).toBeInTheDocument()
  })
})
