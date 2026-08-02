ALTER TABLE public.designer_bank_details
  ADD COLUMN IF NOT EXISTS bank_routing_number text;

ALTER TABLE public.designer_earnings
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS country text;

ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS payout_currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS bank_routing_number text,
  ADD COLUMN IF NOT EXISTS bank_swift_code text,
  ADD COLUMN IF NOT EXISTS bank_iban text,
  ADD COLUMN IF NOT EXISTS bank_country text;