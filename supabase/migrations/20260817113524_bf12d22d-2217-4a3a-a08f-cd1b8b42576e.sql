CREATE OR REPLACE FUNCTION public.claim_social_scheduler_lease(p_lease_seconds int DEFAULT 300)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE claimed int;
BEGIN
  UPDATE public.social_scheduler_state
     SET lease_until = now() + make_interval(secs => p_lease_seconds),
         last_run_at = now()
   WHERE id = 'default'
     AND paused = false
     AND (lease_until IS NULL OR lease_until < now());
  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_social_scheduler_lease(int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_social_scheduler_lease(int) TO service_role;