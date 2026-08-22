CREATE TABLE IF NOT EXISTS public.originals_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  percent_off numeric,
  amount_off_usd numeric,
  min_subtotal_usd numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer,
  times_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.originals_promo_codes TO service_role;
ALTER TABLE public.originals_promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage promo codes" ON public.originals_promo_codes;
CREATE POLICY "Admins manage promo codes"
ON public.originals_promo_codes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.originals_promo_codes TO authenticated;

ALTER TABLE public.originals_orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_usd numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.redeem_originals_promo(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.originals_promo_codes
  SET times_redeemed = times_redeemed + 1, updated_at = now()
  WHERE upper(code) = upper(_code);
$$;