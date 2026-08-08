import { getProducts, getCategories } from '@/lib/products'
import CatalogClient from './CatalogClient'

export const revalidate = 60

export const metadata = { title: 'Catálogo · FYTHER STORE' }

export default async function CatalogoPage() {
  const products = await getProducts()
  const categories = getCategories(products)
  return <CatalogClient products={products} categories={categories} />
}
