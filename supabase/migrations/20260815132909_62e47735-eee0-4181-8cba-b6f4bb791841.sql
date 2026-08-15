CREATE TABLE public.originals_print_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_slug TEXT NOT NULL,
  size_key TEXT NOT NULL,
  stl_url TEXT NOT NULL,
  filament TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sku_slug, size_key)
);
GRANT SELECT ON public.originals_print_models TO authenticated;
GRANT ALL ON public.originals_print_models TO service_role;
ALTER TABLE public.originals_print_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage originals print models" ON public.originals_print_models
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_originals_print_models_updated_at BEFORE UPDATE ON public.originals_print_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.originals_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_slug TEXT NOT NULL,
  size_key TEXT NOT NULL,
  print_file_url TEXT NOT NULL,
  print_usd NUMERIC,
  shipping_usd NUMERIC,
  landed_usd NUMERIC,
  mbp_usd NUMERIC,
  retail_usd NUMERIC,
  feasible BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'live',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.originals_quotes TO service_role;
ALTER TABLE public.originals_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read originals quotes" ON public.originals_quotes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_originals_quotes_lookup ON public.originals_quotes (print_file_url, created_at DESC);

ALTER TABLE public.originals_previews ADD COLUMN IF NOT EXISTS print_file_url TEXT;
ALTER TABLE public.originals_orders ADD COLUMN IF NOT EXISTS quote_source TEXT;
ALTER TABLE public.originals_orders ADD COLUMN IF NOT EXISTS partner_cost_usd NUMERIC;