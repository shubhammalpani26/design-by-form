
-- Drop the expensive ALL policy that evaluates has_role() per row for EVERY operation
DROP POLICY IF EXISTS "Admins can manage all products" ON public.designer_products;

-- Replace with a lean SELECT-only admin policy using inline EXISTS (plannable)
CREATE POLICY "Admins can view all products"
  ON public.designer_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin UPDATE policy (inline EXISTS, no function call overhead)
CREATE POLICY "Admins can update all products"
  ON public.designer_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin INSERT policy
CREATE POLICY "Admins can insert products"
  ON public.designer_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
