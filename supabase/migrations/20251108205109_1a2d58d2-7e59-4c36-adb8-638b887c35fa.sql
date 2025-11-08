-- Update subscriptions table to add Razorpay fields and usage tracking (only if not exists)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS listings_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS listings_limit integer,
ADD COLUMN IF NOT EXISTS three_d_models_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS three_d_models_limit integer;

-- Add constraint for billing_cycle if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_billing_cycle_check'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_billing_cycle_check 
    CHECK (billing_cycle IN ('monthly', 'yearly'));
  END IF;
END $$;

-- Function to reset monthly subscription usage
CREATE OR REPLACE FUNCTION public.reset_monthly_subscription_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    listings_used = 0,
    three_d_models_used = 0,
    updated_at = now()
  WHERE status = 'active'
    AND current_period_end <= now();
END;
$$;