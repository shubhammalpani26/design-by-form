-- Add pricing automation fields to designer_products
ALTER TABLE public.designer_products 
ADD COLUMN IF NOT EXISTS price_reduction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_discount_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_pricing_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS original_designer_price NUMERIC;

-- Update existing products to set original_designer_price
UPDATE public.designer_products 
SET original_designer_price = designer_price 
WHERE original_designer_price IS NULL;

-- Create product pricing history table
CREATE TABLE IF NOT EXISTS public.product_pricing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.designer_products(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('manual', 'auto_reduction', 'reset')),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on pricing history
ALTER TABLE public.product_pricing_history ENABLE ROW LEVEL SECURITY;

-- Allow designers to view their own pricing history
CREATE POLICY "Designers can view their own pricing history"
ON public.product_pricing_history
FOR SELECT
USING (
  product_id IN (
    SELECT id FROM public.designer_products
    WHERE designer_id IN (
      SELECT id FROM public.designer_profiles
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow system to insert pricing history
CREATE POLICY "System can insert pricing history"
ON public.product_pricing_history
FOR INSERT
WITH CHECK (true);

-- Create function to reduce stale product prices
CREATE OR REPLACE FUNCTION public.reduce_stale_product_prices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_record RECORD;
  new_price NUMERIC;
BEGIN
  FOR product_record IN
    SELECT 
      dp.id,
      dp.designer_price,
      dp.base_price,
      dp.current_discount_level,
      dp.original_designer_price
    FROM public.designer_products dp
    WHERE dp.auto_pricing_enabled = true
      AND dp.status = 'approved'
      AND dp.current_discount_level < 10
      AND dp.designer_price > dp.base_price
      AND dp.total_sales = 0
      AND (dp.price_reduction_date IS NULL OR dp.price_reduction_date < now() - INTERVAL '30 days')
  LOOP
    -- Calculate new price (reduce by 10%)
    new_price := product_record.designer_price * 0.9;
    
    -- Don't go below base price
    IF new_price < product_record.base_price THEN
      new_price := product_record.base_price;
    END IF;
    
    -- Log to pricing history
    INSERT INTO public.product_pricing_history (product_id, old_price, new_price, reason)
    VALUES (product_record.id, product_record.designer_price, new_price, 'auto_reduction');
    
    -- Update product
    UPDATE public.designer_products
    SET 
      designer_price = new_price,
      current_discount_level = product_record.current_discount_level + 1,
      price_reduction_date = now(),
      auto_pricing_enabled = CASE WHEN new_price <= product_record.base_price THEN false ELSE true END,
      updated_at = now()
    WHERE id = product_record.id;
    
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.reduce_stale_product_prices() IS 'Automatically reduces prices by 10% monthly for products with no sales until reaching base price';