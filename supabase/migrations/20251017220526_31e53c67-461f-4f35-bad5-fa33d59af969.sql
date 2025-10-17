-- Fix Orders and Order Items RLS Policies
-- Add missing INSERT, UPDATE, DELETE policies for orders table

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add policies for order_items table
CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Fix design_hashes INSERT policy to require authentication
DROP POLICY IF EXISTS "System can insert design hashes" ON public.design_hashes;

CREATE POLICY "Authenticated users can insert design hashes"
  ON public.design_hashes FOR INSERT
  TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.designer_products 
      WHERE designer_id IN (
        SELECT id FROM public.designer_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );