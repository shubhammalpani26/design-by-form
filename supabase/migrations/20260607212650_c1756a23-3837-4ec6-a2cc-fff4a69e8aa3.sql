
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.cleanup_old_design_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.design_sessions
  WHERE updated_at < now() - INTERVAL '30 days';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-design-sessions') THEN
    PERFORM cron.unschedule('cleanup-old-design-sessions');
  END IF;
  PERFORM cron.schedule(
    'cleanup-old-design-sessions',
    '15 3 * * *',
    $cron$ SELECT public.cleanup_old_design_sessions(); $cron$
  );
END
$$;
