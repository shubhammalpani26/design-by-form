
-- Create a SECURITY DEFINER function that checks admin status ONCE
-- then returns all products with designer info, bypassing per-row RLS
CREATE OR REPLACE FUNCTION public.admin_get_all_products()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  status text,
  base_price numeric,
  designer_price numeric,
  designer_id uuid,
  created_at timestamptz,
  image_url text,
  designer_name text,
  designer_email text,
  designer_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin status once
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Return all products with designer info (no RLS overhead)
  RETURN QUERY
  SELECT
    dp.id,
    dp.name,
    dp.description,
    dp.category,
    dp.status,
    dp.base_price,
    dp.designer_price,
    dp.designer_id,
    dp.created_at,
    dp.image_url,
    prof.name AS designer_name,
    prof.email AS designer_email,
    prof.phone_number AS designer_phone
  FROM public.designer_products dp
  LEFT JOIN public.designer_profiles prof ON prof.id = dp.designer_id
  ORDER BY dp.created_at DESC;
END;
$$;
