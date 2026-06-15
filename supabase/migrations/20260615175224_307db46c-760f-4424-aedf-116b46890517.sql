
-- New signups get 5 credits (down from 10), no monthly refill
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, free_credits_reset_at)
  VALUES (
    NEW.id,
    5,
    -- Set far future so the monthly reset job never fires for free users
    'infinity'::timestamptz
  );
  RETURN NEW;
END;
$function$;

-- Disable the monthly auto-refill (kept as no-op so any scheduled job is safe)
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Monthly free credit refill disabled.
  -- Free users get a one-time grant on signup. Top-ups require purchase or admin grant.
  RETURN;
END;
$function$;
