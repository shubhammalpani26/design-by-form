CREATE TABLE public.originals_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ip_hash TEXT,
  sku_slug TEXT NOT NULL,
  personalization JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_image_url TEXT,
  preview_image_url TEXT,
  engineering JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_originals_previews_ip ON public.originals_previews (ip_hash, created_at DESC);
GRANT ALL ON public.originals_previews TO service_role;
ALTER TABLE public.originals_previews ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.originals_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preview_id UUID REFERENCES public.originals_previews(id) ON DELETE SET NULL,
  user_id UUID,
  sku_slug TEXT NOT NULL,
  size_key TEXT NOT NULL,
  size_label TEXT,
  amount_usd NUMERIC NOT NULL,
  personalization JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  customer_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_originals_orders_session ON public.originals_orders (stripe_session_id);
GRANT ALL ON public.originals_orders TO service_role;
ALTER TABLE public.originals_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view originals previews" ON public.originals_previews
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view originals orders" ON public.originals_orders
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.originals_previews TO authenticated;
GRANT SELECT ON public.originals_orders TO authenticated;