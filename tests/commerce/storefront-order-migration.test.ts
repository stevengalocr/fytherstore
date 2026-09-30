import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(
  process.cwd(),
  'supabase/migrations/202608080001_create_fyther_storefront_order.sql',
), 'utf8')

// Este archivo es la implementación ORIGINAL (2026-08-08). La función que corre
// hoy en la base es la puerta del CORE (`bilbildin/supabase/migrations/
// 20260919_puertas_viejas_delegan.sql`), que delega en `crear_pedido` con el
// mismo contrato. Estas pruebas fijan el contrato y el archivo histórico.
describe('Fyther storefront order migration (archivo histórico, mismo contrato que la puerta vigente)', () => {
  it('declares itself superseded by the CORE gate that delegates to crear_pedido', () => {
    expect(migration).toMatch(/ARCHIVO HIST[ÓO]RICO/)
    expect(migration).toMatch(/20260919_puertas_viejas_delegan\.sql/)
    expect(migration).toMatch(/public\.crear_pedido/)
  })

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
