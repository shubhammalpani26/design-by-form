SELECT cron.unschedule('social-scheduler-4x-daily');

SELECT cron.schedule(
  'social-scheduler-4x-daily',
  '0 0,13,16,21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rdcfakdhgndnhgzfkuvw.supabase.co/functions/v1/social-scheduler',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkY2Zha2RoZ25kbmhnemZrdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDY3NDIsImV4cCI6MjA3NTEyMjc0Mn0.g5wmwdJ5IAu-CCv3z9PQtoIQAYFFIv4nUNZDNyVH1d4"}'::jsonb,
    body := jsonb_build_object('time', now())
  );
  $$
);