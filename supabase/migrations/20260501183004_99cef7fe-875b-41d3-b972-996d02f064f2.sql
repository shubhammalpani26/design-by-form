
-- 1. Public RPC for sales counts (security definer bypasses RLS, returns counts only)
CREATE OR REPLACE FUNCTION public.get_designer_sales_counts()
RETURNS TABLE(designer_id uuid, sales_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT designer_id, COUNT(*)::bigint AS sales_count
  FROM public.product_sales
  GROUP BY designer_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_designer_sales_counts() TO anon, authenticated;

-- 2. Convert seeded traction creators into real auth accounts.
-- Set a known password and confirm their emails so they can log in normally.
DO $$
DECLARE
  creator RECORD;
  hashed_password text;
BEGIN
  -- bcrypt hash of 'Nyzora@2026'
  hashed_password := crypt('Nyzora@2026', gen_salt('bf'));

  FOR creator IN
    SELECT id, email, name FROM public.designer_profiles
    WHERE email IN ('astha@nyzora.ai','posh@nyzora.ai','preksha@nyzora.ai','raina@nyzora.ai')
  LOOP
    -- Upsert into auth.users using the existing user_id from designer_profiles
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    )
    SELECT
      '00000000-0000-0000-0000-000000000000',
      dp.user_id,
      'authenticated',
      'authenticated',
      creator.email,
      hashed_password,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', creator.name),
      false, '', '', '', ''
    FROM public.designer_profiles dp
    WHERE dp.id = creator.id
    ON CONFLICT (id) DO UPDATE
      SET encrypted_password = EXCLUDED.encrypted_password,
          email = EXCLUDED.email,
          email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
          updated_at = now();

    -- Make sure an identity row exists so login works
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      dp.user_id,
      jsonb_build_object('sub', dp.user_id::text, 'email', creator.email, 'email_verified', true),
      'email',
      dp.user_id::text,
      now(), now(), now()
    FROM public.designer_profiles dp
    WHERE dp.id = creator.id
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END LOOP;
END $$;
