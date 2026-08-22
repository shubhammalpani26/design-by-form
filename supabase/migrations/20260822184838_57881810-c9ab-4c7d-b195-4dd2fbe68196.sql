CREATE TABLE IF NOT EXISTS public.brand_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_location text,
  author_email text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  photo_url text,
  video_url text,
  verified_purchase boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_reviews_status_created_idx ON public.brand_reviews (status, created_at DESC);

GRANT SELECT ON public.brand_reviews TO anon;
GRANT SELECT ON public.brand_reviews TO authenticated;
GRANT INSERT ON public.brand_reviews TO authenticated;
GRANT ALL ON public.brand_reviews TO service_role;

ALTER TABLE public.brand_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved brand reviews" ON public.brand_reviews;
CREATE POLICY "Anyone can read approved brand reviews" ON public.brand_reviews FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated can submit brand reviews" ON public.brand_reviews;
CREATE POLICY "Authenticated can submit brand reviews" ON public.brand_reviews FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage brand reviews" ON public.brand_reviews;
CREATE POLICY "Admins can manage brand reviews" ON public.brand_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage policies for review-media bucket (bucket itself created via storage API)
DROP POLICY IF EXISTS "Public read access for review media" ON storage.objects;
CREATE POLICY "Public read access for review media" ON storage.objects FOR SELECT USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "Authenticated can upload review media" ON storage.objects;
CREATE POLICY "Authenticated can upload review media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can update own review media" ON storage.objects;
CREATE POLICY "Authenticated can update own review media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'review-media' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Admins can delete review media" ON storage.objects;
CREATE POLICY "Admins can delete review media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'));