
-- Tighten insert policy: designers can only insert pending products
DROP POLICY IF EXISTS "Designers can create products" ON public.designer_products;

CREATE POLICY "Designers can create products"
ON public.designer_products
FOR INSERT
TO authenticated
WITH CHECK (
  designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  )
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR status = 'pending'
  )
);

-- Reset the offending product to pending so it goes through admin review
UPDATE public.designer_products
SET status = 'pending', updated_at = now()
WHERE id = '5797511a-04e7-49ef-af4c-42f5277710a1'
  AND status = 'approved';
