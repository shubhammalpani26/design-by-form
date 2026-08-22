select cron.schedule(
  'originals-tracking-sync-every-30-min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://rdcfakdhgndnhgzfkuvw.supabase.co/functions/v1/originals-tracking-sync',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkY2Zha2RoZ25kbmhnemZrdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDY3NDIsImV4cCI6MjA3NTEyMjc0Mn0.g5wmwdJ5IAu-CCv3z9PQtoIQAYFFIv4nUNZDNyVH1d4"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  );
  $$
);