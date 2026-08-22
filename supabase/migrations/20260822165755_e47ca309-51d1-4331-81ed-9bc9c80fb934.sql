REVOKE SELECT ON public.designer_profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, name, status, slug, plan_tier, is_house, portfolio_url,
  design_background, furniture_interests, profile_picture_url, cover_image_url,
  terms_accepted, terms_accepted_at, created_at, updated_at
) ON public.designer_profiles TO anon, authenticated;

GRANT ALL ON public.designer_profiles TO service_role;