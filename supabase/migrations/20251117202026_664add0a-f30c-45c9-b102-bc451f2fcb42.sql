-- Add company GST configuration table
CREATE TABLE IF NOT EXISTS public.company_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gstin TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add GST fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_gstin TEXT,
ADD COLUMN IF NOT EXISTS customer_state TEXT,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP WITH TIME ZONE;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders
  WHERE invoice_number IS NOT NULL;
  
  invoice_num := 'INV-' || TO_CHAR(next_number, 'FM00000');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
    NEW.invoice_date := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

-- Enable RLS on company_config
ALTER TABLE public.company_config ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read company config
CREATE POLICY "Anyone can view company config"
ON public.company_config
FOR SELECT
USING (true);

-- Only admins can manage company config
CREATE POLICY "Admins can manage company config"
ON public.company_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default company config (you can update this later)
INSERT INTO public.company_config (
  gstin,
  legal_name,
  trade_name,
  address,
  city,
  state,
  pincode,
  email,
  phone
) VALUES (
  '00XXXXX0000X0X0',
  'Your Company Legal Name',
  'Forma',
  'Your Company Address',
  'Your City',
  'Karnataka',
  '000000',
  'admin@forma.com',
  '+91-0000000000'
) ON CONFLICT DO NOTHING;