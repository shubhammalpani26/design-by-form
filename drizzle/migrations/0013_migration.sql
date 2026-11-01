CREATE TABLE public.product_recommendations (
  product_id uuid PRIMARY KEY REFERENCES public.designer_products(id) ON DELETE CASCADE,
  recommended_ids uuid[] NOT NULL DEFAULT '{}',
  source text NOT NULL,
  model text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.product_recommendations TO service_role;

ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;