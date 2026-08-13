ALTER TABLE public.originals_orders
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS originals_orders_group_id_idx ON public.originals_orders (group_id);

UPDATE public.originals_orders SET group_id = id WHERE group_id IS NULL;