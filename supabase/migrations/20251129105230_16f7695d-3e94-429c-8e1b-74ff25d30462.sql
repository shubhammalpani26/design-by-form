-- Create feed_posts table for designer activity feed
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL,
  post_type TEXT NOT NULL, -- 'product_launch', 'milestone', 'achievement', 'behind_scenes'
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- stores milestone numbers, product_id, earnings, etc.
  image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public', 'followers_only'
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (designer_id) REFERENCES public.designer_profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_feed_posts_designer_id ON public.feed_posts(designer_id);
CREATE INDEX idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_post_type ON public.feed_posts(post_type);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public feed posts"
  ON public.feed_posts
  FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Designers can create their own posts"
  ON public.feed_posts
  FOR INSERT
  WITH CHECK (designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Designers can update their own posts"
  ON public.feed_posts
  FOR UPDATE
  USING (designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Designers can delete their own posts"
  ON public.feed_posts
  FOR DELETE
  USING (designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all posts"
  ON public.feed_posts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create feed post on product approval
CREATE OR REPLACE FUNCTION public.create_product_launch_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create post when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.feed_posts (
      designer_id,
      post_type,
      title,
      content,
      metadata,
      image_url
    ) VALUES (
      NEW.designer_id,
      'product_launch',
      'New Design Launch',
      'Just launched ' || NEW.name || '! Check out this unique piece.',
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.name,
        'category', NEW.category,
        'price', NEW.designer_price
      ),
      NEW.image_url
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for product approvals
CREATE TRIGGER create_product_launch_post_trigger
  AFTER INSERT OR UPDATE ON public.designer_products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_product_launch_post();

-- Function to create milestone posts
CREATE OR REPLACE FUNCTION public.create_sales_milestone_post(
  p_designer_id UUID,
  p_milestone INTEGER,
  p_product_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  milestone_title TEXT;
  milestone_content TEXT;
BEGIN
  -- Determine milestone message
  CASE p_milestone
    WHEN 1 THEN
      milestone_title := 'First Sale! 🎉';
      milestone_content := 'Just made my first sale on Forma! This is just the beginning.';
    WHEN 10 THEN
      milestone_title := '10 Sales Milestone! 🚀';
      milestone_content := 'Reached 10 sales! Thank you for the support!';
    WHEN 50 THEN
      milestone_title := '50 Sales Achievement! 🌟';
      milestone_content := 'Half century! 50 sales and counting. Your support means everything!';
    WHEN 100 THEN
      milestone_title := '100 Sales Celebration! 🎊';
      milestone_content := 'Hit the 100 sales mark! Grateful for this amazing community!';
    WHEN 500 THEN
      milestone_title := '500 Sales! 💫';
      milestone_content := '500 sales achieved! This journey has been incredible!';
    ELSE
      RETURN; -- Don't create post for other numbers
  END CASE;

  INSERT INTO public.feed_posts (
    designer_id,
    post_type,
    title,
    content,
    metadata
  ) VALUES (
    p_designer_id,
    'milestone',
    milestone_title,
    milestone_content,
    jsonb_build_object(
      'milestone_type', 'sales',
      'milestone_number', p_milestone,
      'product_name', p_product_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;