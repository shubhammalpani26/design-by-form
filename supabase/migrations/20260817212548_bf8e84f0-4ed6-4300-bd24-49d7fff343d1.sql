-- 1) designer_profiles: stop exposing email / phone_number through the Data API
REVOKE SELECT ON public.designer_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, name, portfolio_url, design_background, furniture_interests,
  status, terms_accepted, terms_accepted_at, created_at, updated_at,
  profile_picture_url, cover_image_url, slug, plan_tier, is_house
) ON public.designer_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.designer_profiles TO authenticated;
GRANT ALL ON public.designer_profiles TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_designer_profile()
RETURNS SETOF public.designer_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.designer_profiles WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_designer_profile() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_designer_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_designer_contacts()
RETURNS TABLE(id uuid, user_id uuid, name text, email text, phone_number text, status text, profile_picture_url text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT p.id, p.user_id, p.name, p.email, p.phone_number, p.status, p.profile_picture_url, p.created_at
  FROM public.designer_profiles p
  ORDER BY p.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_designer_contacts() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_designer_contacts() TO authenticated;

-- 2) manufacturing_intelligence: no public row reads, expose aggregate counters only
DROP POLICY IF EXISTS "Anyone can view manufacturing intelligence" ON public.manufacturing_intelligence;
REVOKE SELECT ON public.manufacturing_intelligence FROM anon;

CREATE OR REPLACE FUNCTION public.get_flywheel_stats()
RETURNS TABLE(orders bigint, signals bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(DISTINCT order_ref) FROM public.manufacturing_intelligence
      WHERE source = 'production' AND order_ref IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM public.manufacturing_intelligence)::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.get_flywheel_stats() TO anon, authenticated;

-- 3) ar_sessions: only signed-in users, only their own rows
DROP POLICY IF EXISTS "Anyone can create AR sessions" ON public.ar_sessions;
CREATE POLICY "Users can create their own AR sessions"
ON public.ar_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
REVOKE INSERT ON public.ar_sessions FROM anon;

-- 4) usage_analytics: only signed-in users, only rows attributed to themselves
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.usage_analytics;
CREATE POLICY "Users can insert their own analytics"
ON public.usage_analytics FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
REVOKE INSERT ON public.usage_analytics FROM anon;

-- 5) user_credits: clients must never mint credit rows
DROP POLICY IF EXISTS "System can insert credits" ON public.user_credits;
REVOKE INSERT, UPDATE, DELETE ON public.user_credits FROM anon, authenticated;
GRANT ALL ON public.user_credits TO service_role;

-- 6) storage: product-images uploads must live under the uploader's own folder
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Users can upload product images to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'studio-sessions'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 7) pin search_path on functions that still had a mutable one
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;