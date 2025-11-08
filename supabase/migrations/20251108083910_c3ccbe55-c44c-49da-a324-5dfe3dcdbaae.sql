-- Add angle_views column to designer_products to store multiple product images
ALTER TABLE designer_products ADD COLUMN IF NOT EXISTS angle_views jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN designer_products.angle_views IS 'Array of image URLs showing product from different angles';
