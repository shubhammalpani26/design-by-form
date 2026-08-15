ALTER TABLE public.originals_previews
  ADD COLUMN IF NOT EXISTS model_task_id text,
  ADD COLUMN IF NOT EXISTS model_status text,
  ADD COLUMN IF NOT EXISTS model_error text;

ALTER TABLE public.originals_orders
  ADD COLUMN IF NOT EXISTS model_task_id text,
  ADD COLUMN IF NOT EXISTS model_status text;

CREATE INDEX IF NOT EXISTS originals_orders_needs_model_idx
  ON public.originals_orders (status, production_status)
  WHERE print_file_url IS NULL;