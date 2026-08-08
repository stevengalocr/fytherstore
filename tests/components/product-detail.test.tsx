import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductDetail from '@/app/catalogo/[slug]/ProductDetail'
import type { CommerceProduct } from '@/lib/commerce/types'

const addProduct = vi.fn()

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ addProduct }),
}))

const product: CommerceProduct = {
  id: 'product-1',
  slug: 'legging-flujo',
  name: 'Legging Flujo',
  shortDescription: 'Suave, versátil y lista para acompañarte.',
  description: 'Una prenda cómoda para moverte a tu manera.',
  price: { amount: 28900, currency: 'CRC' },
  compareAtPrice: null,
  images: [{ src: '/legging-general.jpg', alt: 'Legging Flujo en movimiento' }],
  availability: 'in_stock',
  stockQuantity: 8,
  variants: [
    {
      id: 'variant-s',
      name: 'S',
      sku: 'FY-LF-S',
      price: { amount: 29900, currency: 'CRC' },
      stockQuantity: 2,
      attributes: { size: 'S' },
      images: [{ src: '/legging-s.jpg', alt: 'Legging Flujo talla S' }],
    },
    {
      id: 'variant-m',
      name: 'M',
      sku: 'FY-LF-M',
      price: { amount: 30900, currency: 'CRC' },
      stockQuantity: 0,
      attributes: { size: 'M' },
      images: [],
    },
  ],
  category: 'Leggings',
  tags: [],
  featured: true,
}

describe('ProductDetail', () => {
  beforeEach(() => {
    addProduct.mockReset()
  })

  it('uses the approved product-selection language and live content', () => {
    render(<ProductDetail product={product} />)

    expect(screen.getByRole('link', { name: 'Volver a la colección' })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('group', { name: 'Elige tu opción' })).toBeInTheDocument()
    expect(screen.getByText(product.description!)).toBeInTheDocument()
    expect(screen.getByText('2 disponibles')).toBeInTheDocument()
  })

  it('resets quantity when selecting an available variant', async () => {
    const user = userEvent.setup()
    const productWithSecondAvailableVariant = {
      ...product,
      variants: [
        product.variants[0],
        { ...product.variants[1], stockQuantity: 4 },
      ],
    }
    render(<ProductDetail product={productWithSecondAvailableVariant} />)

    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    expect(screen.getByLabelText('Cantidad seleccionada')).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: 'M' }))
    expect(screen.getByLabelText('Cantidad seleccionada')).toHaveTextContent('1')
  })

  it('never lets quantity exceed the selected variant stock', async () => {
    const user = userEvent.setup()
    render(<ProductDetail product={product} />)

    const increase = screen.getByRole('button', { name: 'Aumentar cantidad' })
    await user.click(increase)
    await user.click(increase)

    expect(screen.getByLabelText('Cantidad seleccionada')).toHaveTextContent('2')
    expect(increase).toBeDisabled()
  })

  it('disables sold-out variants', () => {
    render(<ProductDetail product={product} />)

    expect(screen.getByRole('button', { name: 'M' })).toBeDisabled()
  })

  it('starts with the first variant that has real stock', async () => {
    const user = userEvent.setup()
    const firstAvailableVariant = { ...product.variants[1], stockQuantity: 4 }
    render(<ProductDetail product={{
      ...product,
      variants: [{ ...product.variants[0], stockQuantity: 0 }, firstAvailableVariant],
    }} />)

    expect(screen.getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    expect(addProduct).toHaveBeenCalledWith(expect.any(Object), firstAvailableVariant, 1)
  })

  it('adds the selected product, variant, and real quantity then announces success', async () => {
    const user = userEvent.setup()
    render(<ProductDetail product={product} />)

    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

    expect(addProduct).toHaveBeenCalledWith(product, product.variants[0], 2)
    expect(screen.getByRole('button', { name: 'Agregado al carrito' })).toBeInTheDocument()
    expect(screen.getByText('Agregado al carrito')).toHaveAttribute('aria-live', 'polite')
  })

  it('uses the truthful description fallback only when both descriptions are absent', () => {
    const { rerender } = render(<ProductDetail product={{ ...product, description: null }} />)

    expect(screen.getByText(product.shortDescription!)).toBeInTheDocument()
    expect(screen.queryByText('Información del producto disponible próximamente.')).not.toBeInTheDocument()

    rerender(<ProductDetail product={{ ...product, description: null, shortDescription: null }} />)
    expect(screen.getByText('Información del producto disponible próximamente.')).toBeInTheDocument()
  })

  it('uses a truthful media fallback when the product and variant have no image', () => {
    render(<ProductDetail product={{
      ...product,
      images: [],
      variants: product.variants.map((variant) => ({ ...variant, images: [] })),
    }} />)

    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('updates image, price, and stock from the selected variant', async () => {
    const user = userEvent.setup()
    const secondVariant = {
      ...product.variants[1],
      stockQuantity: 4,
      images: [{ src: '/legging-m.jpg', alt: 'Legging Flujo talla M' }],
    }
    render(<ProductDetail product={{ ...product, variants: [product.variants[0], secondVariant] }} />)

    await user.click(screen.getByRole('button', { name: 'M' }))

    expect(screen.getByRole('img', { name: 'Legging Flujo talla M' })).toBeInTheDocument()
    expect(screen.getByText(/30[.,\s]900/)).toBeInTheDocument()
    expect(screen.getByText('4 disponibles')).toBeInTheDocument()
  })

  it('does not allow unavailable products to be added', async () => {
    const user = userEvent.setup()
    render(<ProductDetail product={{
      ...product,
      availability: 'out_of_stock',
      stockQuantity: 0,
      variants: [],
    }} />)

    const button = screen.getByRole('button', { name: 'Agotado' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(addProduct).not.toHaveBeenCalled()
  })
})
