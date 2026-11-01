CREATE TABLE public.gift_recommendations (
  page_key text PRIMARY KEY,
  slugs text[] NOT NULL DEFAULT '{}',
  source text NOT NULL,
  model text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.gift_recommendations TO service_role;

ALTER TABLE public.gift_recommendations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.product_recommendations IS 'DEPRECATED: replaced by gift_recommendations (You may also like shows US-made gift items only)';