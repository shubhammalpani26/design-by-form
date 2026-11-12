-- Pricing and company settings are only read by backend functions (service role) and admins.
DROP POLICY IF EXISTS "Anyone can view pricing config" ON public.pricing_config;
DROP POLICY IF EXISTS "Anyone can view company config" ON public.company_config;

CREATE POLICY "Admins can view pricing config"
ON public.pricing_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view company config"
ON public.company_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Review media is stored in product-images; the review-media bucket does not exist.
-- Remove the unbounded public read rule; only admins may read anything in review-media.
DROP POLICY IF EXISTS "Public read access for review media" ON storage.objects;

CREATE POLICY "Admins can read review media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'));