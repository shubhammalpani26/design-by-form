-- Fix search_path for existing functions to improve security
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
    10,
    date_trunc('month', now()) + interval '1 month'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_credits
  SET 
    balance = balance + 10,
    free_credits_reset_at = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  WHERE free_credits_reset_at <= now();
  
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  SELECT 
    user_id,
    10,
    'monthly_reset',
    'Monthly free credits reset'
  FROM public.user_credits
  WHERE free_credits_reset_at <= now();
END;
$function$;
