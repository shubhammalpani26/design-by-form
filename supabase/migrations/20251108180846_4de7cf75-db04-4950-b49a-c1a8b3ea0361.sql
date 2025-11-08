-- Create currency_rates table for caching exchange rates
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'INR',
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can view currency rates
CREATE POLICY "Anyone can view currency rates"
  ON public.currency_rates
  FOR SELECT
  USING (true);

-- System can manage currency rates
CREATE POLICY "System can manage currency rates"
  ON public.currency_rates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_currency_rates_lookup ON public.currency_rates(base_currency, target_currency);

-- Insert some default rates (will be updated by edge function)
INSERT INTO public.currency_rates (base_currency, target_currency, rate) VALUES
  ('INR', 'USD', 0.012),
  ('INR', 'EUR', 0.011),
  ('INR', 'GBP', 0.0095),
  ('INR', 'AUD', 0.018),
  ('INR', 'CAD', 0.016),
  ('INR', 'JPY', 1.75),
  ('INR', 'INR', 1.0)
ON CONFLICT (base_currency, target_currency) DO NOTHING;