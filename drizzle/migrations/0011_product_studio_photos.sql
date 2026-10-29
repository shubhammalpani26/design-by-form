ALTER TABLE public.designer_products
  ADD COLUMN IF NOT EXISTS studio_image_url text,
  ADD COLUMN IF NOT EXISTS studio_image_at timestamptz,
  ADD COLUMN IF NOT EXISTS studio_shopify_media_id text,
  ADD COLUMN IF NOT EXISTS studio_image_error text;