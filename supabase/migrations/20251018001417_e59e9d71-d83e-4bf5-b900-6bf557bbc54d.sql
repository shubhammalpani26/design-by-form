-- Update dimensions column to allow proper storage
-- The dimensions column already exists as jsonb, so we just need to add a comment
COMMENT ON COLUMN public.designer_products.dimensions IS 'Product dimensions in format: {"length": 48, "breadth": 24, "height": 30} (inches)';