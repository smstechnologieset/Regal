-- ============================================================================
-- Atomic attire order creation
-- ----------------------------------------------------------------------------
-- Wraps the order + order_items inserts in a single transaction so a failure
-- half-way through can never leave an order with no items (or vice-versa).
--
-- SECURITY INVOKER (default): the caller's RLS still applies, so a user can
-- only create an order for themselves exactly as with the previous direct
-- inserts. The whole function body is one transaction — any raised error rolls
-- everything back.
--
-- Run this in the Supabase SQL editor.
-- ============================================================================

create or replace function public.create_attire_order(
  p_user_id uuid,
  p_total numeric,
  p_details jsonb,
  p_shipping_address jsonb,
  p_promo_code text,
  p_discount numeric,
  p_has_preorders boolean,
  p_preorder_status text,
  p_items jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  insert into public.orders (
    user_id, total, status, details, shipping_address, service_type,
    promo_code, discount_amount, has_preorders, preorder_status
  )
  values (
    p_user_id, p_total, 'pending', p_details, p_shipping_address, 'attire',
    p_promo_code, coalesce(p_discount, 0), p_has_preorders, p_preorder_status
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id, product_id, quantity, price, selected_size, selected_color,
      is_preorder, estimated_delivery_date, preorder_status
    )
    values (
      v_order_id,
      (v_item->>'product_id'),
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      (v_item->>'selected_size'),
      (v_item->'selected_color'),
      coalesce((v_item->>'is_preorder')::boolean, false),
      nullif(v_item->>'estimated_delivery_date', '')::timestamptz,
      nullif(v_item->>'preorder_status', '')
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.create_attire_order(
  uuid, numeric, jsonb, jsonb, text, numeric, boolean, text, jsonb
) to authenticated;
