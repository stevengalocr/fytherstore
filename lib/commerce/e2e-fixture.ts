import 'server-only'
import type { CommerceProduct } from '@/lib/commerce/types'

const fixtureProducts: CommerceProduct[] = [
  {
    id: 'fyther-e2e-accesorio-01',
    slug: 'accesorio-fyther-uno',
    name: 'Accesorio Fyther Uno',
    shortDescription: null,
    description: null,
    price: { amount: 15000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/ropa.png', alt: 'Accesorio Fyther Uno' }],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category: 'Accesorios',
    tags: [],
    featured: true,
  },
  {
    id: 'fyther-e2e-accesorio-02',
    slug: 'accesorio-fyther-dos',
    name: 'Accesorio Fyther Dos',
    shortDescription: null,
    description: null,
    price: { amount: 18000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/modelo2.png', alt: 'Accesorio Fyther Dos' }],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category: 'Accesorios',
    tags: [],
    featured: false,
  },
]

export const e2eFixtureCommerce = {
  async getProducts(): Promise<CommerceProduct[]> {
    return [...fixtureProducts]
  },

  async getProductBySlug(slug: string): Promise<CommerceProduct | null> {
    return fixtureProducts.find((product) => product.slug === slug) ?? null
  },
}
