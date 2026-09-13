ALTER TABLE public.originals_quotes ADD COLUMN IF NOT EXISTS grams numeric;
ALTER TABLE public.originals_orders ADD COLUMN IF NOT EXISTS weight_grams numeric;