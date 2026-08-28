GRANT UPDATE ON public.originals_orders TO authenticated;
CREATE POLICY "Admins can update originals orders"
ON public.originals_orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));