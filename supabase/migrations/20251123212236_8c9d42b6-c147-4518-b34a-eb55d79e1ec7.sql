-- Add comprehensive admin policies for all tables

-- Designer profiles: Allow admins to update and delete
CREATE POLICY "Admins can update designer profiles"
ON public.designer_profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete designer profiles"
ON public.designer_profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all designer profiles"
ON public.designer_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Products: Ensure admins can delete
CREATE POLICY "Admins can delete products"
ON public.designer_products
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Notifications: Allow admins to manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- User credits: Allow admins to manage all credits
CREATE POLICY "Admins can manage all credits"
ON public.user_credits
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Credit transactions: Allow admins to view and manage
CREATE POLICY "Admins can manage credit transactions"
ON public.credit_transactions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- AR sessions: Allow admins to manage
CREATE POLICY "Admins can manage AR sessions"
ON public.ar_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Design hashes: Allow admins to manage
CREATE POLICY "Admins can manage design hashes"
ON public.design_hashes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Product sales: Allow admins to manage
CREATE POLICY "Admins can manage product sales"
ON public.product_sales
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Product pricing history: Allow admins to manage
CREATE POLICY "Admins can manage pricing history"
ON public.product_pricing_history
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Subscriptions: Allow admins to view all
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Subscription transactions: Allow admins to view all
CREATE POLICY "Admins can view all subscription transactions"
ON public.subscription_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Cart: Allow admins to manage
CREATE POLICY "Admins can manage all carts"
ON public.cart
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Design listings: Allow admins full control
CREATE POLICY "Admins can manage all listings"
ON public.design_listings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));