alter table public.social_scheduled_posts
  add column if not exists fb_status text not null default 'pending',
  add column if not exists fb_scheduled_at timestamptz,
  add column if not exists fb_post_id text,
  add column if not exists fb_caption text,
  add column if not exists fb_attempts int not null default 0,
  add column if not exists fb_error text;
-- Only posts from Sept 5 onward (plinth fixed) and upcoming ones go to Facebook.
update public.social_scheduled_posts set fb_status='skip'
 where slot_type='story' or status='cancelled' or (status='published' and published_at < '2026-09-05') or status in ('failed','needs_review');
create index if not exists social_posts_fb_due on public.social_scheduled_posts (fb_status, fb_scheduled_at);