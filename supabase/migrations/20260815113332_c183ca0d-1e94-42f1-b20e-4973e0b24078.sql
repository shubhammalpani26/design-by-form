ALTER TABLE public.originals_orders
  ADD COLUMN IF NOT EXISTS production_status text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS partner_order_id text,
  ADD COLUMN IF NOT EXISTS print_file_url text,
  ADD COLUMN IF NOT EXISTS tracking_numbers text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfillment_error text;

CREATE INDEX IF NOT EXISTS idx_originals_orders_user ON public.originals_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_originals_orders_email ON public.originals_orders(lower(customer_email));

GRANT SELECT ON public.originals_orders TO authenticated;
GRANT ALL ON public.originals_orders TO service_role;

DROP POLICY IF EXISTS "Buyers can view their own originals orders" ON public.originals_orders;
CREATE POLICY "Buyers can view their own originals orders"
  ON public.originals_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());