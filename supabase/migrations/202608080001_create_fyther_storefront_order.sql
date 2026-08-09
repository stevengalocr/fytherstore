create table if not exists public.storefront_order_requests (
  business_id uuid not null references public.businesses(id) on delete cascade,
  idempotency_key uuid not null,
  result jsonb not null,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (business_id, idempotency_key)
);

alter table public.storefront_order_requests enable row level security;
revoke all on table public.storefront_order_requests from public, anon, authenticated;

create index if not exists idx_storefront_order_requests_created_at
  on public.storefront_order_requests (created_at);

comment on table public.storefront_order_requests
is 'Persistent storefront idempotency ledger. Entries must outlive the supported order retry window.';

create or replace function public.create_fyther_storefront_order(
  p_business_id uuid,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
  v_business record;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_payment_method text;
  v_db_payment_method text;
  v_email text;
  v_shipping_address jsonb;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_stock_before integer;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_total_cost numeric := 0;
begin
  if p_business_id is null or p_idempotency_key is null then
    raise exception 'invalid_checkout_payload';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'fyther-storefront-order:' || p_business_id::text || ':' || p_idempotency_key::text,
      0
    )
  );

  select request.result
  into v_result
  from public.storefront_order_requests request
  where request.business_id = p_business_id
    and request.idempotency_key = p_idempotency_key;

  if found then
    return v_result;
  end if;

  if pg_catalog.jsonb_typeof(p_payload) is distinct from 'object'
    or pg_catalog.jsonb_typeof(p_payload->'customer') is distinct from 'object'
    or pg_catalog.jsonb_typeof(p_payload->'shipping_address') is distinct from 'object'
    or pg_catalog.jsonb_typeof(p_payload->'items') is distinct from 'array'
  then
    raise exception 'invalid_checkout_payload';
  end if;

  if pg_catalog.jsonb_array_length(p_payload->'items') not between 1 and 20 then
    raise exception 'invalid_checkout_payload';
  end if;

  select business.id, business.account_status, coalesce(business.theme_config, '{}'::jsonb) as theme_config
  into v_business
  from public.businesses business
  where business.id = p_business_id
    and business.account_status = 'active';

  if not found then
    raise exception 'store_not_active';
  end if;

  v_payment_method := p_payload->>'payment_method';
  v_db_payment_method := case v_payment_method
    when 'sinpe' then 'sinpe'
    when 'link' then 'card'
    when 'cash' then 'cash'
    else null
  end;

  if v_db_payment_method is null
    or (v_payment_method = 'sinpe' and nullif(pg_catalog.btrim(v_business.theme_config->>'sinpe_number'), '') is null)
    or (v_payment_method = 'link' and nullif(pg_catalog.btrim(v_business.theme_config->>'link_url'), '') is null)
    or (v_payment_method = 'cash' and nullif(pg_catalog.btrim(v_business.theme_config->>'cash_instructions'), '') is null)
  then
    raise exception 'invalid_payment_method';
  end if;

  v_email := pg_catalog.lower(pg_catalog.btrim(p_payload->'customer'->>'email'));
  if nullif(pg_catalog.btrim(p_payload->'customer'->>'name'), '') is null
    or pg_catalog.length(pg_catalog.btrim(p_payload->'customer'->>'name')) > 140
    or pg_catalog.length(pg_catalog.btrim(p_payload->'customer'->>'phone')) > 24
    or v_email is null
    or pg_catalog.length(v_email) > 254
    or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or nullif(pg_catalog.btrim(p_payload->'shipping_address'->>'address'), '') is null
    or pg_catalog.length(pg_catalog.btrim(p_payload->'shipping_address'->>'address')) > 300
    or pg_catalog.length(pg_catalog.btrim(p_payload->'shipping_address'->>'city')) > 120
    or pg_catalog.length(pg_catalog.btrim(p_payload->'shipping_address'->>'country')) > 80
    or pg_catalog.length(pg_catalog.btrim(p_payload->'shipping_address'->>'notes')) > 500
  then
    raise exception 'invalid_customer_details';
  end if;

  v_shipping_address := pg_catalog.jsonb_build_object(
    'address', pg_catalog.btrim(p_payload->'shipping_address'->>'address'),
    'city', coalesce(pg_catalog.btrim(p_payload->'shipping_address'->>'city'), ''),
    'country', coalesce(nullif(pg_catalog.btrim(p_payload->'shipping_address'->>'country'), ''), 'Costa Rica'),
    'notes', coalesce(pg_catalog.btrim(p_payload->'shipping_address'->>'notes'), '')
  );

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_payload->'items') candidate
    where pg_catalog.jsonb_typeof(candidate) is distinct from 'object'
      or pg_catalog.jsonb_typeof(candidate->'product_id') is distinct from 'string'
      or (candidate->>'product_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or pg_catalog.jsonb_typeof(candidate->'quantity') is distinct from 'number'
      or (candidate->>'quantity') !~ '^[1-8]$'
      or (
        candidate ? 'variant_id'
        and candidate->'variant_id' <> 'null'::jsonb
        and (
          pg_catalog.jsonb_typeof(candidate->'variant_id') is distinct from 'string'
          or (candidate->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        )
      )
  ) then
    raise exception 'invalid_checkout_payload';
  end if;

  for v_item in
    select pg_catalog.jsonb_build_object(
      'product_id', parsed.product_id,
      'variant_id', parsed.variant_id,
      'quantity', pg_catalog.sum(parsed.quantity)
    )
    from (
      select
        (candidate->>'product_id')::uuid as product_id,
        case when candidate->'variant_id' is null or candidate->'variant_id' = 'null'::jsonb
          then null
          else (candidate->>'variant_id')::uuid
        end as variant_id,
        (candidate->>'quantity')::integer as quantity
      from pg_catalog.jsonb_array_elements(p_payload->'items') candidate
    ) parsed
    group by parsed.product_id, parsed.variant_id
    order by parsed.product_id, parsed.variant_id nulls first
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    if v_quantity not between 1 and 8 then
      raise exception 'invalid_quantity';
    end if;

    select product.id, product.name, product.price, product.cost_price,
           product.images, product.stock_quantity
    into v_product
    from public.products product
    where product.id = v_product_id
      and product.business_id = p_business_id
      and product.status = 'visible'
    for update;

    if not found then
      raise exception 'product_unavailable';
    end if;

    if v_variant_id is not null then
      select variant.id, variant.name, variant.price_modifier,
             variant.images, variant.stock_quantity
      into v_variant
      from public.product_variants variant
      where variant.id = v_variant_id
        and variant.product_id = v_product_id
      for update;

      if not found then
        raise exception 'variant_unavailable';
      end if;
      v_stock_before := v_variant.stock_quantity;
      v_unit_price := v_product.price + coalesce(v_variant.price_modifier, 0);
    else
      v_stock_before := v_product.stock_quantity;
      v_unit_price := v_product.price;
    end if;

    if v_stock_before < v_quantity then
      raise exception 'insufficient_stock';
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
    v_total_cost := v_total_cost + (coalesce(v_product.cost_price, 0) * v_quantity);
  end loop;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('fyther-storefront-customer:' || p_business_id::text || ':' || v_email, 0)
  );

  select customer.id
  into v_customer_id
  from public.store_customers customer
  where customer.business_id = p_business_id
    and pg_catalog.lower(customer.email) = v_email
  order by customer.created_at
  limit 1
  for update;

  if v_customer_id is null then
    insert into public.store_customers (business_id, name, email, phone)
    values (
      p_business_id,
      pg_catalog.btrim(p_payload->'customer'->>'name'),
      v_email,
      nullif(pg_catalog.left(pg_catalog.btrim(p_payload->'customer'->>'phone'), 24), '')
    )
    returning id into v_customer_id;
  else
    update public.store_customers
    set name = pg_catalog.btrim(p_payload->'customer'->>'name'),
        phone = nullif(pg_catalog.left(pg_catalog.btrim(p_payload->'customer'->>'phone'), 24), '')
    where id = v_customer_id
      and business_id = p_business_id;
  end if;

  v_order_number := 'FY-' ||
    pg_catalog.to_char(pg_catalog.timezone('America/Costa_Rica', pg_catalog.now()), 'YYYYMMDD') || '-' ||
    pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    business_id, customer_id, order_number, status, subtotal, total, total_cost,
    payment_method, payment_status, shipping_address, billing_address, notes
  )
  values (
    p_business_id,
    v_customer_id,
    v_order_number,
    'pending',
    v_subtotal,
    v_subtotal,
    v_total_cost,
    v_db_payment_method,
    'pending',
    v_shipping_address,
    v_shipping_address,
    nullif(v_shipping_address->>'notes', '')
  )
  returning id into v_order_id;

  for v_item in
    select pg_catalog.jsonb_build_object(
      'product_id', parsed.product_id,
      'variant_id', parsed.variant_id,
      'quantity', pg_catalog.sum(parsed.quantity)
    )
    from (
      select
        (candidate->>'product_id')::uuid as product_id,
        case when candidate->'variant_id' is null or candidate->'variant_id' = 'null'::jsonb
          then null
          else (candidate->>'variant_id')::uuid
        end as variant_id,
        (candidate->>'quantity')::integer as quantity
      from pg_catalog.jsonb_array_elements(p_payload->'items') candidate
    ) parsed
    group by parsed.product_id, parsed.variant_id
    order by parsed.product_id, parsed.variant_id nulls first
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select product.id, product.name, product.price, product.cost_price,
           product.images, product.stock_quantity
    into v_product
    from public.products product
    where product.id = v_product_id
      and product.business_id = p_business_id;

    if v_variant_id is not null then
      select variant.id, variant.name, variant.price_modifier,
             variant.images, variant.stock_quantity
      into v_variant
      from public.product_variants variant
      where variant.id = v_variant_id
        and variant.product_id = v_product_id;
      v_stock_before := v_variant.stock_quantity;
      v_unit_price := v_product.price + coalesce(v_variant.price_modifier, 0);
    else
      v_stock_before := v_product.stock_quantity;
      v_unit_price := v_product.price;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_image,
      quantity, unit_price, unit_cost, subtotal
    )
    values (
      v_order_id,
      v_product.id,
      v_variant_id,
      case when v_variant_id is null then v_product.name else v_product.name || ' - ' || v_variant.name end,
      case when v_variant_id is null then v_product.images[1] else coalesce(v_variant.images[1], v_product.images[1]) end,
      v_quantity,
      v_unit_price,
      coalesce(v_product.cost_price, 0),
      v_unit_price * v_quantity
    );

    if v_variant_id is not null then
      update public.product_variants
      set stock_quantity = stock_quantity - v_quantity
      where id = v_variant_id
        and product_id = v_product_id;
    else
      update public.products
      set stock_quantity = stock_quantity - v_quantity,
          updated_at = pg_catalog.now()
      where id = v_product_id
        and business_id = p_business_id;
    end if;

    insert into public.inventory_movements (
      business_id, product_id, variant_id, movement_type,
      quantity_change, stock_before, stock_after, notes
    )
    values (
      p_business_id,
      v_product_id,
      v_variant_id,
      'sale',
      -v_quantity,
      v_stock_before,
      v_stock_before - v_quantity,
      'Pedido ' || v_order_number || ' creado desde Fyther Store'
    );
  end loop;

  update public.store_customers
  set total_orders = coalesce(total_orders, 0) + 1,
      total_spent = coalesce(total_spent, 0) + v_subtotal
  where id = v_customer_id
    and business_id = p_business_id;

  insert into public.order_tracking (order_id, status, title, description, location)
  values (
    v_order_id,
    'pending',
    'Pedido recibido',
    case v_payment_method
      when 'sinpe' then 'Fyther recibió tu pedido y coordinará contigo el pago por SINPE Móvil.'
      when 'link' then 'Fyther recibió tu pedido y confirmará contigo el enlace de pago.'
      else 'Fyther recibió tu pedido y coordinará contigo el pago al entregar.'
    end,
    nullif(v_shipping_address->>'city', '')
  );

  v_result := pg_catalog.jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'status', 'pending',
    'total', v_subtotal,
    'currency', 'CRC'
  );

  insert into public.storefront_order_requests (business_id, idempotency_key, result)
  values (p_business_id, p_idempotency_key, v_result);

  return v_result;
end;
$function$;

revoke execute on function public.create_fyther_storefront_order(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_fyther_storefront_order(uuid, uuid, jsonb) to service_role;

comment on function public.create_fyther_storefront_order(uuid, uuid, jsonb)
is 'Creates one Fyther storefront order atomically with variant-aware stock and idempotent retries.';
