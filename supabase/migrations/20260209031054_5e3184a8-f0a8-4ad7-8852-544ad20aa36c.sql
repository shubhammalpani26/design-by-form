
-- Part 1: Add indexes on designer_products for faster RLS evaluation, JOINs, and sorting
CREATE INDEX IF NOT EXISTS idx_designer_products_designer_id ON public.designer_products (designer_id);
CREATE INDEX IF NOT EXISTS idx_designer_products_status ON public.designer_products (status);
CREATE INDEX IF NOT EXISTS idx_designer_products_created_at ON public.designer_products (created_at DESC);

-- Also add index on user_roles for faster has_role() lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);

-- Part 2: Simplify redundant RLS policy on designer_profiles
-- Drop the policy with OR true that unnecessarily calls has_role()
DROP POLICY IF EXISTS "Anyone can view approved designer profiles (safe columns)" ON public.designer_profiles;

-- Re-create with simplified condition (no has_role call needed since OR true made it always pass)
CREATE POLICY "Anyone can view approved designer profiles (safe columns)"
ON public.designer_profiles
FOR SELECT
USING (status = 'approved');
