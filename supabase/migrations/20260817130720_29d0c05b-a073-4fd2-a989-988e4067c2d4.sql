UPDATE public.social_scheduled_posts
SET image_url = NULL, engineering = NULL, engineering_status = 'pending', status = 'scheduled', attempts = 0, last_error = NULL, updated_at = now()
WHERE status <> 'published' AND is_render = true AND scheduled_at > now();