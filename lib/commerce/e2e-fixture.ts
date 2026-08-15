import 'server-only'
import type { CommerceProduct } from '@/lib/commerce/types'

const fixtureProducts: CommerceProduct[] = [
  {
    id: 'fyther-e2e-accesorio-01',
    slug: 'accesorio-fyther-uno',
    name: 'Accesorio Fyther Uno',
    brand: 'Nike',
    shortDescription: null,
    description: null,
    price: { amount: 15000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/ropa.png', alt: 'Accesorio Fyther Uno' }],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category: 'Accesorios',
    tags: ['Botellas', 'Gym'],
    featured: true,
  },
  {
    id: 'fyther-e2e-accesorio-02',
    slug: 'accesorio-fyther-dos',
    name: 'Accesorio Fyther Dos',
    brand: 'Alo',
    shortDescription: null,
    description: null,
    price: { amount: 18000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/modelo2.png', alt: 'Accesorio Fyther Dos' }],
    availability: 'in_stock',
    stockQuantity: 1,
    variants: [],
    category: 'Accesorios',
    tags: ['Gym', 'Organización'],
    featured: false,
  },
  {
    id: 'fyther-e2e-accesorio-03',
    slug: 'accesorio-fyther-tres',
    name: 'Accesorio Fyther Tres',
    brand: null,
    shortDescription: 'Un detalle para tu rutina diaria',
    description: null,
    price: { amount: 12000, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/home.jpeg', alt: 'Accesorio Fyther Tres' }],
    availability: 'in_stock',
    stockQuantity: 2,
    variants: [],
    category: 'Accesorios',
    tags: ['Regalos'],
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
