// Lectura del catálogo — espejo en vivo del admin de BilBildin.
// Siempre con anon key + filtro por BUSINESS_ID + status 'visible'.
// cost_price NO se incluye (el rol anon no puede leerlo).
import { supabase, BUSINESS_ID } from '@/lib/supabase'
import type { Product } from '@/lib/types'

const SELECT =
  'id,name,slug,short_description,description,price,compare_at_price,images,category,tags,attributes,featured,stock_quantity'

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('business_id', BUSINESS_ID)
    .eq('status', 'visible')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[getProducts]', error.message)
    return []
  }
  return (data ?? []) as Product[]
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('business_id', BUSINESS_ID)
    .eq('status', 'visible')
    .eq('featured', true)
    .limit(limit)
  if (error) {
    console.error('[getFeaturedProducts]', error.message)
    return []
  }
  return (data ?? []) as Product[]
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`${SELECT}, variants:product_variants(*)`)
    .eq('business_id', BUSINESS_ID)
    .eq('status', 'visible')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[getProductBySlug]', error.message)
    return null
  }
  return (data as Product) ?? null
}

export function getCategories(products: Product[]): string[] {
  return [...new Set(products.map(p => p.category).filter((c): c is string => !!c))]
}
