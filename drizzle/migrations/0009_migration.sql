ALTER TABLE public.originals_orders ADD COLUMN IF NOT EXISTS meta_tracking jsonb;
ALTER TABLE public.originals_orders ADD COLUMN IF NOT EXISTS meta_capi_sent_at timestamptz;