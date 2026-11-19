ALTER TABLE public.originals_promo_codes
  ADD COLUMN IF NOT EXISTS allowed_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blind_ship boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.originals_promo_codes.allowed_emails IS
  'When non-empty, the code only works for a signed-in account whose verified email is in this list (trade/reseller codes).';
COMMENT ON COLUMN public.originals_promo_codes.blind_ship IS
  'Orders using this code ship without the Nyzora packing card (reseller ships to their own customer).';

CREATE TABLE IF NOT EXISTS public.originals_trade_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  company text,
  daily_preview_limit integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.originals_trade_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.originals_trade_accounts TO authenticated;
ALTER TABLE public.originals_trade_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage trade accounts"
ON public.originals_trade_accounts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_originals_trade_accounts_updated_at
BEFORE UPDATE ON public.originals_trade_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();