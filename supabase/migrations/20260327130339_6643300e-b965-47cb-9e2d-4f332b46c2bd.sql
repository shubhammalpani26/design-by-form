
-- Create slugify function
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text AS $$
BEGIN
  RETURN trim(both '-' from
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(input_text), '[^a-z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add slug columns
ALTER TABLE designer_products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE designer_profiles ADD COLUMN IF NOT EXISTS slug text;

-- Backfill slugs
UPDATE designer_products SET slug = generate_slug(name) WHERE slug IS NULL;
UPDATE designer_profiles SET slug = generate_slug(name) WHERE slug IS NULL;

-- Handle duplicate product slugs by appending row number
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM designer_products
  WHERE slug IS NOT NULL
)
UPDATE designer_products p
SET slug = d.slug || '-' || d.rn
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- Handle duplicate profile slugs
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM designer_profiles
  WHERE slug IS NOT NULL
)
UPDATE designer_profiles p
SET slug = d.slug || '-' || d.rn
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_designer_products_slug ON designer_products(slug);
CREATE INDEX IF NOT EXISTS idx_designer_profiles_slug ON designer_profiles(slug);

-- Auto-generate slug on insert/update for products
CREATE OR REPLACE FUNCTION set_slug_on_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name) THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_product_slug ON designer_products;
CREATE TRIGGER trg_set_product_slug
  BEFORE INSERT OR UPDATE ON designer_products
  FOR EACH ROW EXECUTE FUNCTION set_slug_on_product();

-- Auto-generate slug on insert/update for profiles
CREATE OR REPLACE FUNCTION set_slug_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name) THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_profile_slug ON designer_profiles;
CREATE TRIGGER trg_set_profile_slug
  BEFORE INSERT OR UPDATE ON designer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_slug_on_profile();
