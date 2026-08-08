import type { CommerceProduct } from '@/lib/commerce/types'

export const demoProducts: CommerceProduct[] = [
  {
    id: 'demo-motion-tee',
    slug: 'motion-tee',
    name: 'Motion Tee (demo)',
    shortDescription: 'Camiseta técnica de muestra para recorrer la experiencia Fyther.',
    description: 'Producto de demostración. Sus datos no representan inventario ni una oferta comercial activa.',
    price: { amount: 18900, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/home.jpeg', alt: 'Escena de campaña Fyther usada en el modo demo' }],
    availability: 'in_stock',
    stockQuantity: 4,
    variants: [
      { id: 'demo-motion-tee-s', name: 'Talla S', sku: null, price: { amount: 18900, currency: 'CRC' }, stockQuantity: 2, attributes: { size: 'S' }, images: [] },
      { id: 'demo-motion-tee-m', name: 'Talla M', sku: null, price: { amount: 18900, currency: 'CRC' }, stockQuantity: 2, attributes: { size: 'M' }, images: [] },
    ],
    category: 'Ropa',
    tags: ['demo'],
    featured: true,
    demo: true,
  },
  {
    id: 'demo-training-layer',
    slug: 'training-layer',
    name: 'Training Layer (demo)',
    shortDescription: 'Capa deportiva de muestra para validar variantes y disponibilidad.',
    description: 'Producto de demostración. Al conectar BilBildin, este contenido se reemplaza por el catálogo real.',
    price: { amount: 32900, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/home.jpeg', alt: 'Escena editorial Fyther usada como imagen de demostración' }],
    availability: 'in_stock',
    stockQuantity: 3,
    variants: [],
    category: 'Ropa',
    tags: ['demo'],
    featured: true,
    demo: true,
  },
  {
    id: 'demo-daily-bag',
    slug: 'daily-bag',
    name: 'Daily Bag (demo)',
    shortDescription: 'Accesorio de muestra para probar el carrito y checkout.',
    description: 'Producto de demostración sin relación con stock o precios reales de Fyther.',
    price: { amount: 24500, currency: 'CRC' },
    compareAtPrice: null,
    images: [{ src: '/home.jpeg', alt: 'Equipaje en una escena de campaña Fyther' }],
    availability: 'in_stock',
    stockQuantity: 2,
    variants: [],
    category: 'Accesorios',
    tags: ['demo'],
    featured: false,
    demo: true,
  },
  {
    id: 'demo-recovery-cap',
    slug: 'recovery-cap',
    name: 'Recovery Cap (demo)',
    shortDescription: 'Estado agotado de muestra.',
    description: 'Producto de demostración para verificar la experiencia sin existencias.',
    price: { amount: 14900, currency: 'CRC' },
    compareAtPrice: null,
    images: [],
    availability: 'out_of_stock',
    stockQuantity: 0,
    variants: [],
    category: 'Accesorios',
    tags: ['demo'],
    featured: false,
    demo: true,
  },
]

export const demoCommerce = {
  async getProducts(): Promise<CommerceProduct[]> {
    return demoProducts
  },
  async getProductBySlug(slug: string): Promise<CommerceProduct | null> {
    return demoProducts.find((product) => product.slug === slug) ?? null
  },
}
