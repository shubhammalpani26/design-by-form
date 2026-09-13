ALTER TABLE public.originals_promo_codes
  ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;

-- Internal test code: 100% off, capped by resolvePromo at subtotal - $1,
-- so an admin test order charges exactly $1. Only valid for admin users.
INSERT INTO public.originals_promo_codes (code, description, percent_off, min_subtotal_usd, active, admin_only)
VALUES ('NYZORA-INTERNAL', 'Internal test order — admin only, reduces total to $1.', 100, 0, true, true)
ON CONFLICT (code) DO UPDATE
  SET percent_off = EXCLUDED.percent_off,
      active = true,
      admin_only = true,
      description = EXCLUDED.description,
      updated_at = now();