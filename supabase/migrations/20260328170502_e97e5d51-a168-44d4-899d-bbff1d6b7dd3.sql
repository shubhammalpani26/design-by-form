
-- 1. Allow designers to delete their OWN products
CREATE POLICY "Designers can delete their own products"
ON public.designer_products
FOR DELETE
TO authenticated
USING (
  designer_id IN (
    SELECT id FROM designer_profiles WHERE user_id = auth.uid()
  )
);

-- 2. Drop the existing unrestricted designer update policy
DROP POLICY "Designers can update their own products" ON public.designer_products;

-- 3. Re-create designer update policy that prevents self-approval
-- Designers can update their own products but cannot change status to 'approved'
CREATE POLICY "Designers can update their own products"
ON public.designer_products
FOR UPDATE
TO authenticated
USING (
  designer_id IN (
    SELECT id FROM designer_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  designer_id IN (
    SELECT id FROM designer_profiles WHERE user_id = auth.uid()
  )
  AND (
    -- Either the user is an admin (can set any status)
    public.has_role(auth.uid(), 'admin')
    -- Or the status is NOT being set to 'approved' (prevent self-approval)
    OR status != 'approved'
  )
);
