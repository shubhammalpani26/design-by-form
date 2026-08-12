CREATE TABLE public.originals_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_slug text NOT NULL,
  author_name text NOT NULL,
  author_location text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  photo_url text,
  verified_purchase boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX originals_reviews_sku_status_idx ON public.originals_reviews (sku_slug, status, created_at DESC);

GRANT SELECT ON public.originals_reviews TO anon;
GRANT SELECT ON public.originals_reviews TO authenticated;
GRANT ALL ON public.originals_reviews TO service_role;

ALTER TABLE public.originals_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews"
  ON public.originals_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can manage reviews"
  ON public.originals_reviews FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));