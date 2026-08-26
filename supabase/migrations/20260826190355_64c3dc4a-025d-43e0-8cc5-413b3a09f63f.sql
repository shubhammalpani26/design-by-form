SELECT cron.unschedule('social-scheduler-4x-daily');

SELECT cron.schedule(
  'social-scheduler-4x-daily',
  '0 0,13,16,21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rdcfakdhgndnhgzfkuvw.supabase.co/functions/v1/social-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('app.settings.anon_key', true)
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);