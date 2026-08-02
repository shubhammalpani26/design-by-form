ALTER TABLE public.designer_products
  ADD COLUMN IF NOT EXISTS shopify_product_id text,
  ADD COLUMN IF NOT EXISTS shopify_variant_id text,
  ADD COLUMN IF NOT EXISTS shopify_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS shopify_sync_error text;

CREATE UNIQUE INDEX IF NOT EXISTS designer_products_shopify_product_id_key
  ON public.designer_products (shopify_product_id)
  WHERE shopify_product_id IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shopify_order_id text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR';

CREATE UNIQUE INDEX IF NOT EXISTS orders_shopify_order_id_key
  ON public.orders (shopify_order_id)
  WHERE shopify_order_id IS NOT NULL;