ALTER TABLE public.social_scheduled_posts DROP CONSTRAINT social_scheduled_posts_status_check;
ALTER TABLE public.social_scheduled_posts ADD CONSTRAINT social_scheduled_posts_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'ready'::text, 'needs_review'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'cancelled'::text]));