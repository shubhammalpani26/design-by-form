CREATE OR REPLACE FUNCTION public.get_designer_follower_count(p_designer_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::bigint FROM public.designer_follows WHERE designer_id = p_designer_id
$$;
GRANT EXECUTE ON FUNCTION public.get_designer_follower_count(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can view follows" ON public.designer_follows;
CREATE POLICY "Users can view own follows" ON public.designer_follows FOR SELECT TO authenticated USING ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Anyone can view likes" ON public.feed_post_likes;
CREATE POLICY "Users can view own likes" ON public.feed_post_likes FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Anyone can view saves count" ON public.feed_post_saves;
CREATE POLICY "Users can view own saves" ON public.feed_post_saves FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can insert finish images" ON public.product_finish_images;
DROP POLICY IF EXISTS "Anyone can view finish images" ON public.product_finish_images;
CREATE POLICY "Anyone can view finish images of approved products" ON public.product_finish_images FOR SELECT TO anon, authenticated
  USING (product_id IN (SELECT id FROM public.designer_products WHERE status = 'approved'));

DROP POLICY IF EXISTS "Authenticated can submit brand reviews" ON public.brand_reviews;
CREATE POLICY "Authenticated can submit pending brand reviews" ON public.brand_reviews FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND verified_purchase = false AND rating BETWEEN 1 AND 5
    AND length(trim(author_name)) BETWEEN 1 AND 100 AND length(trim(body)) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit valid contact form" ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (read = false AND length(trim(first_name)) BETWEEN 1 AND 100 AND length(trim(last_name)) BETWEEN 1 AND 100
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' AND length(email) <= 255
    AND length(trim(subject)) BETWEEN 1 AND 200 AND length(trim(message)) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "Anyone can submit early access signup" ON public.early_access_signups;
CREATE POLICY "Anyone can submit valid early access signup" ON public.early_access_signups FOR INSERT TO anon, authenticated
  WITH CHECK ((email IS NOT NULL OR whatsapp IS NOT NULL) AND length(category) BETWEEN 1 AND 100
    AND (email IS NULL OR (length(email) <= 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
    AND (whatsapp IS NULL OR length(whatsapp) <= 30));

DROP POLICY IF EXISTS "Anyone can leave an anonymous answer" ON public.originals_holdback_answers;
CREATE POLICY "Anyone can leave a valid anonymous answer" ON public.originals_holdback_answers FOR INSERT TO anon, authenticated
  WITH CHECK (length(reason) BETWEEN 1 AND 50 AND (other_text IS NULL OR length(other_text) <= 500)
    AND (sku_slug IS NULL OR length(sku_slug) <= 100) AND (campaign IS NULL OR length(campaign) <= 200));

DROP POLICY IF EXISTS "Authenticated can upload review media" ON storage.objects;
CREATE POLICY "Authenticated can upload own review media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND (storage.foldername(name))[1] = (select auth.uid()::text));