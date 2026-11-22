DROP POLICY IF EXISTS "Anyone can check design hashes" ON public.design_hashes;

CREATE POLICY "Creators can view their own design hashes"
ON public.design_hashes
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT dp.id FROM public.designer_products dp
    WHERE dp.designer_id IN (
      SELECT pr.id FROM public.designer_profiles pr WHERE pr.user_id = auth.uid()
    )
  )
);

GRANT SELECT, INSERT ON public.design_hashes TO authenticated;
GRANT ALL ON public.design_hashes TO service_role;
REVOKE ALL ON public.design_hashes FROM anon;