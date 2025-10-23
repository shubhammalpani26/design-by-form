-- Add pricing analytics columns to designer_products table for data analysis
ALTER TABLE public.designer_products 
ADD COLUMN IF NOT EXISTS pricing_complexity TEXT,
ADD COLUMN IF NOT EXISTS pricing_per_cubic_foot NUMERIC,
ADD COLUMN IF NOT EXISTS pricing_reasoning TEXT,
ADD COLUMN IF NOT EXISTS pricing_calculated_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.designer_products.pricing_complexity IS 'AI-analyzed complexity level (low/medium/high) - for internal analytics only';
COMMENT ON COLUMN public.designer_products.pricing_per_cubic_foot IS 'AI-calculated price per cubic foot used for base pricing - for internal analytics only';
COMMENT ON COLUMN public.designer_products.pricing_reasoning IS 'AI reasoning behind pricing decision - for internal analytics only';
COMMENT ON COLUMN public.designer_products.pricing_calculated_at IS 'Timestamp when pricing was calculated by AI';