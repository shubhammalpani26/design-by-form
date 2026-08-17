update public.originals_orders
set production_status = 'in_production', updated_at = now()
where partner_order_id is not null
  and production_status in ('queued','pending','awaiting_shipment');