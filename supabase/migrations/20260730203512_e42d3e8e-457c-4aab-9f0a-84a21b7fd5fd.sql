-- 1. Product manufacturing routing fields
ALTER TABLE public.designer_products
  ADD COLUMN IF NOT EXISTS manufacturing_method text NOT NULL DEFAULT 'artisan_in',
  ADD COLUMN IF NOT EXISTS production_region text NOT NULL DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS dimensions_verified boolean NOT NULL DEFAULT true;

ALTER TABLE public.designer_products
  DROP CONSTRAINT IF EXISTS designer_products_manufacturing_method_check;
ALTER TABLE public.designer_products
  ADD CONSTRAINT designer_products_manufacturing_method_check
  CHECK (manufacturing_method IN ('artisan_in', 'fdm_us'));

ALTER TABLE public.designer_products
  DROP CONSTRAINT IF EXISTS designer_products_production_region_check;
ALTER TABLE public.designer_products
  ADD CONSTRAINT designer_products_production_region_check
  CHECK (production_region IN ('IN', 'US'));

CREATE INDEX IF NOT EXISTS idx_designer_products_mfg_method
  ON public.designer_products (manufacturing_method, status);

-- 2. US manufacturing tiers lookup
CREATE TABLE IF NOT EXISTS public.manufacturing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key text NOT NULL UNIQUE,
  tier_name text NOT NULL,
  description text,
  manufacturing_method text NOT NULL DEFAULT 'fdm_us',
  max_width_mm integer NOT NULL,
  max_depth_mm integer NOT NULL,
  max_height_mm integer NOT NULL,
  min_wall_mm numeric NOT NULL DEFAULT 2.0,
  max_overhang_deg integer NOT NULL DEFAULT 45,
  modular_allowed boolean NOT NULL DEFAULT false,
  price_min_usd numeric NOT NULL,
  price_max_usd numeric NOT NULL,
  example_products text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.manufacturing_tiers TO anon;
GRANT SELECT ON public.manufacturing_tiers TO authenticated;
GRANT ALL ON public.manufacturing_tiers TO service_role;

ALTER TABLE public.manufacturing_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active manufacturing tiers" ON public.manufacturing_tiers;
CREATE POLICY "Anyone can view active manufacturing tiers"
  ON public.manufacturing_tiers FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage manufacturing tiers" ON public.manufacturing_tiers;
CREATE POLICY "Admins manage manufacturing tiers"
  ON public.manufacturing_tiers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_manufacturing_tiers_updated_at ON public.manufacturing_tiers;
CREATE TRIGGER update_manufacturing_tiers_updated_at
  BEFORE UPDATE ON public.manufacturing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed the US tiers
INSERT INTO public.manufacturing_tiers
  (tier_key, tier_name, description, max_width_mm, max_depth_mm, max_height_mm, modular_allowed, price_min_usd, price_max_usd, example_products, sort_order)
VALUES
  ('objects', 'Objects', 'Sculptural tabletop pieces made in one print.', 250, 250, 250, false, 35, 120, 'Vases, bowls, catchalls, bookends, incense holders', 1),
  ('lighting', 'Lighting', 'Translucent shades and diffusers where layer texture reads as intentional.', 250, 250, 250, false, 60, 200, 'Table lamp shades, pendant diffusers, sconce shells', 2),
  ('wall_systems', 'Wall Systems', 'Tessellating modular tiles sold in sets — the size limit becomes the design language.', 250, 60, 250, true, 40, 250, 'Modular wall tiles, geometric panels, hooks, mirror frames', 3),
  ('desk', 'Desk', 'Functional desk and workspace objects.', 250, 250, 250, false, 25, 90, 'Monitor risers, organizers, pen cups, phone docks', 4),
  ('furniture_parts', 'Furniture Parts', 'Components that pair with off-the-shelf or local materials.', 250, 250, 250, true, 15, 80, 'Table legs, knobs, brackets, shelf brackets', 5),
  ('figurines', 'Figurines & Miniatures', 'Character busts, figures and collectible miniatures.', 250, 250, 250, false, 30, 150, 'Busts, character figures, tabletop miniatures, custom portrait figures', 6)
ON CONFLICT (tier_key) DO NOTHING;

-- 4. Flag products still on placeholder measurements
UPDATE public.designer_products
SET dimensions_verified = false
WHERE dimensions IS NULL
   OR (dimensions->>'width' = '60' AND dimensions->>'depth' = '60' AND dimensions->>'height' = '80');