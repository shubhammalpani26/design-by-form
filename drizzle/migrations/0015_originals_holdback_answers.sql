CREATE TABLE public.originals_holdback_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason text NOT NULL CHECK (reason IN ('price','unsure_look','just_curious','buying_later','unsure_new_site','other')),
  other_text text CHECK (other_text IS NULL OR char_length(other_text) <= 200),
  sku_slug text CHECK (sku_slug IS NULL OR char_length(sku_slug) <= 80),
  campaign text CHECK (campaign IS NULL OR char_length(campaign) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.originals_holdback_answers TO anon;
GRANT INSERT, SELECT ON public.originals_holdback_answers TO authenticated;
GRANT ALL ON public.originals_holdback_answers TO service_role;

ALTER TABLE public.originals_holdback_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can leave an anonymous answer"
ON public.originals_holdback_answers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read answers"
ON public.originals_holdback_answers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX originals_holdback_answers_created_idx ON public.originals_holdback_answers (created_at DESC);