-- Stripe fields on the existing subscriptions table (Razorpay columns stay for historical rows)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS monthly_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_refilled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_key
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_user_env_idx
  ON public.subscriptions (user_id, environment);

-- Plan tier drives the Verified Creator badge and soft-cap enforcement
ALTER TABLE public.designer_profiles
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'free';

-- Ledger of one-time credit-pack purchases, used for webhook idempotency
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL UNIQUE,
  price_id text NOT NULL,
  credits integer NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_purchases TO authenticated;
GRANT ALL ON public.credit_purchases TO service_role;

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases"
  ON public.credit_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit purchases"
  ON public.credit_purchases FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Single source of truth for "is this user on a paid plan right now?"
-- Canceled subscriptions keep access until the period ends (soft-cap on expiry).
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'sandbox')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing', 'past_due')
          AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;