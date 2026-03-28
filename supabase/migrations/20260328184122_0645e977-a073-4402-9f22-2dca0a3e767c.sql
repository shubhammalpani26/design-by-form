
CREATE TABLE public.product_finish_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.designer_products(id) ON DELETE CASCADE,
  finish_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, finish_name)
);

ALTER TABLE public.product_finish_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view finish images"
  ON public.product_finish_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert finish images"
  ON public.product_finish_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
