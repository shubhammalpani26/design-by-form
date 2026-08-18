UPDATE public.social_scheduled_posts
SET image_url = NULL,
    status = 'scheduled',
    engineering_status = 'pending',
    attempts = 0
WHERE is_render = true
  AND status <> 'published'
  AND scheduled_at > now();