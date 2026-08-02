ALTER TABLE public.designer_products
  ADD COLUMN IF NOT EXISTS print_file_url text,
  ADD COLUMN IF NOT EXISTS slant3d_price_usd numeric,
  ADD COLUMN IF NOT EXISTS slant3d_quoted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS slant3d_quote_error text,
  ADD COLUMN IF NOT EXISTS slant3d_filament text NOT NULL DEFAULT 'PLA BLACK';

CREATE TABLE IF NOT EXISTS public.slant3d_fulfillments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.designer_products(id) ON DELETE SET NULL,
  designer_id uuid REFERENCES public.designer_profiles(id) ON DELETE SET NULL,
  slant_order_id text,
  order_number text,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  tracking_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
  quoted_price_usd numeric,
  request_payload jsonb,
  response_payload jsonb,
  error text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.slant3d_fulfillments TO authenticated;
GRANT ALL ON public.slant3d_fulfillments TO service_role;

ALTER TABLE public.slant3d_fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all US print jobs"
ON public.slant3d_fulfillments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators view their own US print jobs"
ON public.slant3d_fulfillments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.designer_profiles dp
  WHERE dp.id = slant3d_fulfillments.designer_id AND dp.user_id = auth.uid()
));

CREATE INDEX IF NOT EXISTS idx_slant3d_fulfillments_status ON public.slant3d_fulfillments(status);
CREATE INDEX IF NOT EXISTS idx_slant3d_fulfillments_order ON public.slant3d_fulfillments(order_id);

CREATE TRIGGER update_slant3d_fulfillments_updated_at
BEFORE UPDATE ON public.slant3d_fulfillments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();