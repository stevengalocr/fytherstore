import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(
  process.cwd(),
  'supabase/migrations/202608080001_create_fyther_storefront_order.sql',
), 'utf8')

describe('Fyther storefront order migration', () => {
  it('keeps the complete checkout in one security-definer transaction', () => {
    expect(migration).toMatch(/create table if not exists public\.storefront_order_requests/i)
    expect(migration).toMatch(/primary key \(business_id, idempotency_key\)/i)
    expect(migration).toMatch(/alter table public\.storefront_order_requests enable row level security/i)
    expect(migration).toMatch(/revoke all on table public\.storefront_order_requests from public, anon, authenticated/i)
    expect(migration).toMatch(/create or replace function public\.create_fyther_storefront_order/i)
    expect(migration).toMatch(/security definer/i)
    expect(migration).toMatch(/set search_path\s*=\s*''/i)
    expect(migration).toMatch(/pg_advisory_xact_lock/i)
    expect(migration).toMatch(/storefront_order_requests/i)
    expect(migration).toMatch(/jsonb_typeof\(p_payload->'items'\) is distinct from 'array'/i)
    expect(migration).toMatch(/jsonb_build_object\([\s\S]*'address'[\s\S]*'city'[\s\S]*'country'[\s\S]*'notes'/i)
  })

  it('locks and decrements the correct stock source for variants and base products', () => {
    expect(migration).toMatch(/from public\.products[\s\S]*for update/i)
    expect(migration).toMatch(/from public\.product_variants[\s\S]*for update/i)
    expect(migration).toMatch(/update public\.product_variants[\s\S]*stock_quantity\s*=\s*stock_quantity\s*-\s*v_quantity/i)
    expect(migration).toMatch(/update public\.products[\s\S]*stock_quantity\s*=\s*stock_quantity\s*-\s*v_quantity/i)
    expect(migration).toMatch(/variant_id/i)
  })

  it('is callable only by the server service role', () => {
    expect(migration).toMatch(/revoke execute on function public\.create_fyther_storefront_order\(uuid, uuid, jsonb\) from public, anon, authenticated/i)
    expect(migration).toMatch(/grant execute on function public\.create_fyther_storefront_order\(uuid, uuid, jsonb\) to service_role/i)
  })
})
