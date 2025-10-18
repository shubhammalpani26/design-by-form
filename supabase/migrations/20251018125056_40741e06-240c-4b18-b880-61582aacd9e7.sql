-- Add model_url column to designer_products for 3D model URLs
ALTER TABLE public.designer_products 
ADD COLUMN IF NOT EXISTS model_url text;