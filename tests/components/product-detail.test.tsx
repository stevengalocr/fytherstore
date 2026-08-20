import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProductDetail from '@/app/catalogo/[slug]/ProductDetail'
import type { CommerceProduct } from '@/lib/commerce/types'

const addProduct = vi.fn()
const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ addProduct }),
}))

const product: CommerceProduct = {
  id: 'product-1',
  slug: 'legging-flujo',
  name: 'Legging Flujo',
  brand: null,
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the approved product-selection language and live content', () => {
    render(<ProductDetail product={product} />)

    expect(screen.getByRole('link', { name: 'Volver a la colección' })).toHaveAttribute('href', '/catalogo')
    expect(screen.getByRole('group', { name: 'Elige tu opción' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Cantidad de Legging Flujo' })).toBeInTheDocument()
    expect(screen.getByText(product.description!)).toBeInTheDocument()
    expect(screen.getByText('2 disponibles')).toBeInTheDocument()
  })

  it('renders only an explicit brand above the product name', () => {
    const { rerender } = render(<ProductDetail product={{ ...product, brand: 'Nike' }} />)

    const brand = screen.getByText('Nike')
    const name = screen.getByRole('heading', { level: 1, name: product.name })
    expect(screen.getByText('Nike')).toHaveClass('detail-brand')
    expect(brand.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    rerender(<ProductDetail product={{ ...product, brand: null }} />)
    expect(screen.queryByText('Nike')).not.toBeInTheDocument()
    expect(document.querySelector('.detail-brand')).not.toBeInTheDocument()
  })

  it('keeps variant names accessible and exposes the selected Talla M state', async () => {
    const user = userEvent.setup()
    const sizedProduct = {
      ...product,
      variants: [
        { ...product.variants[0], name: 'Talla S' },
        { ...product.variants[1], name: 'Talla M', stockQuantity: 4 },
      ],
    }
    render(<ProductDetail product={sizedProduct} />)

    const small = screen.getByRole('button', { name: 'Talla S' })
    const medium = screen.getByRole('button', { name: 'Talla M' })
    expect(small).toHaveAttribute('aria-pressed', 'true')
    expect(medium).toHaveAttribute('aria-pressed', 'false')

    await user.click(medium)
    expect(small).toHaveAttribute('aria-pressed', 'false')
    expect(medium).toHaveAttribute('aria-pressed', 'true')
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

  it('derives the selected variant from the latest product data', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ProductDetail product={product} />)

    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    const updatedVariant = {
      ...product.variants[0],
      price: { amount: 31900, currency: 'CRC' as const },
      stockQuantity: 4,
    }
    const updatedProduct = { ...product, variants: [updatedVariant, product.variants[1]] }
    rerender(<ProductDetail product={updatedProduct} />)

    expect(screen.getByText(/31[.,\s]900/)).toBeInTheDocument()
    expect(screen.getByText('4 disponibles')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    expect(addProduct).toHaveBeenCalledWith(updatedProduct, updatedVariant, 2)
  })

  it('recovers when the selected variant is removed from live product data', async () => {
    const user = userEvent.setup()
    const availableMedium = { ...product.variants[1], stockQuantity: 4 }
    const { rerender } = render(<ProductDetail product={{
      ...product,
      variants: [product.variants[0], availableMedium],
    }} />)

    await user.click(screen.getByRole('button', { name: 'M' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    const currentSmall = { ...product.variants[0], stockQuantity: 3 }
    const updatedProduct = { ...product, variants: [currentSmall] }
    rerender(<ProductDetail product={updatedProduct} />)

    expect(screen.getByRole('button', { name: 'S' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Cantidad seleccionada')).toHaveTextContent('1')
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    expect(addProduct).toHaveBeenCalledWith(updatedProduct, currentSmall, 1)
  })

  it('does not press a disabled option when every variant is sold out', () => {
    render(<ProductDetail product={{
      ...product,
      availability: 'out_of_stock',
      variants: product.variants.map((variant) => ({ ...variant, stockQuantity: 0 })),
    }} />)

    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled()
  })

  it('adds the selected product, variant, and real quantity then announces success', async () => {
    const user = userEvent.setup()
    render(<ProductDetail product={product} />)

    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

    expect(addProduct).toHaveBeenCalledWith(product, product.variants[0], 2)
    expect(screen.getByRole('button', { name: 'Agregado al carrito' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('Agregado al carrito')
  })

  it('clears pending feedback when another selection action supersedes it', () => {
    const clearTimeout = vi.spyOn(window, 'clearTimeout')
    const setTimeout = vi.spyOn(window, 'setTimeout')
    const availableMedium = { ...product.variants[1], stockQuantity: 4 }
    const { unmount } = render(<ProductDetail product={{
      ...product,
      variants: [product.variants[0], availableMedium],
    }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    const feedbackTimerIndex = setTimeout.mock.calls.findIndex(([, delay]) => delay === 1800)
    const feedbackTimer = setTimeout.mock.results[feedbackTimerIndex]?.value
    fireEvent.click(screen.getByRole('button', { name: 'M' }))

    expect(clearTimeout).toHaveBeenCalledWith(feedbackTimer)
    unmount()
    expect(clearTimeout.mock.calls.filter(([timer]) => timer === feedbackTimer)).toHaveLength(1)
  })

  it('clears pending feedback when the product detail unmounts', () => {
    const clearTimeout = vi.spyOn(window, 'clearTimeout')
    const setTimeout = vi.spyOn(window, 'setTimeout')
    const { unmount } = render(<ProductDetail product={product} />)

    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    const feedbackTimerIndex = setTimeout.mock.calls.findIndex(([, delay]) => delay === 1800)
    const feedbackTimer = setTimeout.mock.results[feedbackTimerIndex]?.value
    unmount()

    expect(clearTimeout).toHaveBeenCalledWith(feedbackTimer)
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

  it('stacks purchase controls throughout the narrow tablet range', () => {
    const tabletStart = globalsCss.indexOf('@media (max-width: 900px)')
    const mobileStart = globalsCss.indexOf('@media (max-width: 767px)')
    const tabletCss = globalsCss.slice(tabletStart, mobileStart)

    expect(tabletStart).toBeGreaterThan(-1)
    expect(mobileStart).toBeGreaterThan(tabletStart)
    expect(tabletCss).toMatch(/\.purchase-row\s*\{[^}]*flex-direction:\s*column/)
    expect(tabletCss).toMatch(/\.quantity-control\s*\{[^}]*width:\s*100%/)
  })

  it('uses the responsive detail geometry and touch control tokens', () => {
    const tabletStart = globalsCss.indexOf('@media (max-width: 900px)')
    const mobileStart = globalsCss.indexOf('@media (max-width: 767px)')
    const tabletCss = globalsCss.slice(tabletStart, mobileStart)

    expect(globalsCss).toMatch(/\.detail-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.25fr\)\s+minmax\(290px,\s*0\.75fr\)/)
    expect(tabletCss).toMatch(/\.detail-layout\s*\{[^}]*grid-template-columns:\s*1fr/)
    expect(globalsCss).toMatch(/\.detail-media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*5[^}]*border-radius:\s*var\(--radius-editorial\)/)
    expect(globalsCss).toMatch(/\.variant-fieldset button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px[^}]*border-radius:\s*var\(--radius-panel\)/)
    expect(globalsCss).toMatch(/\.quantity-control\s*\{[^}]*border-radius:\s*var\(--radius-panel\)/)
    expect(globalsCss).toMatch(/\.quantity-control button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/)
  })
})
