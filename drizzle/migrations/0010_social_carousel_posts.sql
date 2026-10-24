ALTER TABLE public.social_scheduled_posts ADD COLUMN IF NOT EXISTS media_urls jsonb;
ALTER TABLE public.social_scheduled_posts DROP CONSTRAINT IF EXISTS social_scheduled_posts_slot_type_check;
ALTER TABLE public.social_scheduled_posts ADD CONSTRAINT social_scheduled_posts_slot_type_check CHECK (slot_type = ANY (ARRAY['feed'::text, 'story'::text, 'reel'::text, 'carousel'::text]));
COMMENT ON COLUMN public.social_scheduled_posts.media_urls IS 'Ordered slide URLs for carousel posts (2-10 images); image_url holds the cover slide.';