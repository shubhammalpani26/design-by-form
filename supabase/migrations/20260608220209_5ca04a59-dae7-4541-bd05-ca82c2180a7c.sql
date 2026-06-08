
-- 1. designer_profiles: revoke email/phone from anon
REVOKE SELECT (email, phone_number) ON public.designer_profiles FROM anon;
-- Also revoke from authenticated for non-owners via column grant: keep authenticated full access (admins/owner via existing policies handle this)
-- (authenticated users can still SELECT email/phone but RLS policies restrict rows: owner + admin)
-- Note: the "Anyone can view approved" policy applies to public role; column-level revoke from anon prevents anon from selecting these columns.

-- 2. user_credits: drop self-update policy
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- 3. currency_rates: tighten manage policy
DROP POLICY IF EXISTS "System can manage currency rates" ON public.currency_rates;
CREATE POLICY "Admins can manage currency rates"
  ON public.currency_rates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. audit_log: drop public insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- 5. credit_transactions: drop public insert
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;

-- 6. designer_earnings: drop public insert
DROP POLICY IF EXISTS "System can insert earnings" ON public.designer_earnings;

-- 7. notifications: drop public insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- 8. subscription_transactions: drop public insert
DROP POLICY IF EXISTS "System can insert transactions" ON public.subscription_transactions;

-- 9. product_pricing_history: drop public insert
DROP POLICY IF EXISTS "System can insert pricing history" ON public.product_pricing_history;

-- 10. storage: tighten product-images UPDATE
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
-- (no replacement: uploads use insert/upsert=false; service role bypasses RLS for admin functions)

-- 11. Revoke EXECUTE on admin/trigger SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.admin_get_all_products() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_design_sessions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reduce_stale_product_prices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_subscription_usage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_sales_milestone_post(uuid, integer, text) FROM PUBLIC, anon, authenticated;
-- Trigger functions (not directly callable by clients, safe to revoke)
REVOKE EXECUTE ON FUNCTION public.award_referral_on_first_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_product_launch_post() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM PUBLIC, anon, authenticated;
