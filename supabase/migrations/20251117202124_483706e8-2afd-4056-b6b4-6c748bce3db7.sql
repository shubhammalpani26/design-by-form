-- Fix security warnings by setting search_path on functions

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
    NEW.invoice_date := now();
  END IF;
  RETURN NEW;
END;
$$;