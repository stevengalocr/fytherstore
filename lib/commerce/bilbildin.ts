import { createPublicClient, getBusinessId } from '@/lib/supabase'
import { mapBilBildinProduct, type BilBildinProductRow } from '@/lib/commerce/mappers'
import type { CommerceProduct } from '@/lib/commerce/types'

const SELECT = `id,name,slug,short_description,description,price,compare_at_price,images,category,tags,attributes,featured,stock_quantity,variants:product_variants(id,product_id,name,sku,price_modifier,stock_quantity,attributes,images)`

export const bilBildinCommerce = {
  async getProducts(): Promise<CommerceProduct[]> {
    const { data, error } = await createPublicClient()
      .from('products')
      .select(SELECT)
      .eq('business_id', getBusinessId())
      .eq('status', 'visible')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw new Error('No pudimos cargar el catálogo en este momento.')
    return ((data ?? []) as unknown as BilBildinProductRow[]).map(mapBilBildinProduct)
  },

  async getProductBySlug(slug: string): Promise<CommerceProduct | null> {
    const { data, error } = await createPublicClient()
      .from('products')
      .select(SELECT)
      .eq('business_id', getBusinessId())
      .eq('status', 'visible')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw new Error('No pudimos cargar este producto.')
    return data ? mapBilBildinProduct(data as unknown as BilBildinProductRow) : null
  },
}
