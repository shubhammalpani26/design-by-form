-- Populate feed with existing approved products
INSERT INTO public.feed_posts (
  designer_id,
  post_type,
  title,
  content,
  metadata,
  image_url,
  visibility
)
SELECT 
  dp.designer_id,
  'product_launch',
  'New Design Launch',
  'Just launched ' || dp.name || '! Check out this unique piece.',
  jsonb_build_object(
    'product_id', dp.id,
    'product_name', dp.name,
    'category', dp.category,
    'price', dp.designer_price
  ),
  dp.image_url,
  'public'
FROM public.designer_products dp
WHERE dp.status = 'approved'
  AND dp.id NOT IN (
    SELECT (metadata->>'product_id')::uuid 
    FROM public.feed_posts 
    WHERE metadata->>'product_id' IS NOT NULL
  );

-- Create table for post likes
CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.feed_post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.feed_post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.feed_post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for designer follows
CREATE TABLE IF NOT EXISTS public.designer_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  designer_id UUID NOT NULL REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, designer_id)
);

ALTER TABLE public.designer_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.designer_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow designers"
  ON public.designer_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow designers"
  ON public.designer_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.feed_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();