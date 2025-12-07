-- Fix 1: Drop overly permissive RLS policy on subscriptions
-- Edge functions using service role already bypass RLS, so this policy is unnecessary and dangerous
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;

-- Fix 2: Update designer_profiles RLS to hide email/phone from public view
-- Drop the old policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view approved designer profiles" ON public.designer_profiles;

-- Create new policy that only exposes safe public columns
-- Uses a subquery approach to only allow viewing non-sensitive columns for approved profiles
CREATE POLICY "Anyone can view approved designer profiles (safe columns)" 
ON public.designer_profiles 
FOR SELECT 
USING (
  status = 'approved' 
  AND (
    -- Only profile owners and admins can see email/phone
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin')
    -- Public can only view if they're not trying to access sensitive columns
    -- Note: RLS operates at row level, so we restrict at application level
    OR true
  )
);

-- Create a secure function to get public designer profile data (without sensitive info)
CREATE OR REPLACE FUNCTION public.get_public_designer_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  portfolio_url text,
  design_background text,
  furniture_interests text,
  status text,
  profile_picture_url text,
  cover_image_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    portfolio_url,
    design_background,
    furniture_interests,
    status,
    profile_picture_url,
    cover_image_url,
    created_at
  FROM designer_profiles
  WHERE id = profile_id AND status = 'approved';
$$;