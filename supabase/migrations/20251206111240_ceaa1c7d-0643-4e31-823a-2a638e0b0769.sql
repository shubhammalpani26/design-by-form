-- Create table for saving/bookmarking posts
CREATE TABLE public.feed_post_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.feed_post_saves ENABLE ROW LEVEL SECURITY;

-- RLS policies for feed_post_saves
CREATE POLICY "Anyone can view saves count" 
  ON public.feed_post_saves 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can save posts" 
  ON public.feed_post_saves 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" 
  ON public.feed_post_saves 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add cover_image_url to designer_profiles for profile cover photos
ALTER TABLE public.designer_profiles 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add image_urls JSONB array for multiple images per post
ALTER TABLE public.feed_posts 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;