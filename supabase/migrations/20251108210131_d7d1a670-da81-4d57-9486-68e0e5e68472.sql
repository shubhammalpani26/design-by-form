-- Drop and recreate the plan_type constraint to allow our new plan types
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_plan_type_check 
CHECK (plan_type IN ('forma_pro', 'creator', 'pro'));

-- Drop and recreate the status constraint to include 'pending'
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('pending', 'active', 'canceled', 'past_due', 'incomplete'));