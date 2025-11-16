-- Create separate table for sensitive bank details
CREATE TABLE public.designer_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID UNIQUE REFERENCES public.designer_profiles(id) ON DELETE CASCADE NOT NULL,
  bank_account_holder_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_swift_code TEXT,
  bank_iban TEXT,
  bank_country TEXT,
  bank_details_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.designer_bank_details ENABLE ROW LEVEL SECURITY;

-- Only owner and admin can view bank details
CREATE POLICY "Designers view own bank details"
ON public.designer_bank_details FOR SELECT
TO authenticated
USING (
  designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin')
);

-- Only owner can update their bank details
CREATE POLICY "Designers update own bank details"
ON public.designer_bank_details FOR UPDATE
TO authenticated
USING (
  designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  )
);

-- Only owner can insert their bank details
CREATE POLICY "Designers insert own bank details"
ON public.designer_bank_details FOR INSERT
TO authenticated
WITH CHECK (
  designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  )
);

-- Only admin can delete bank details
CREATE POLICY "Admin can delete bank details"
ON public.designer_bank_details FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Migrate existing bank data to new table
INSERT INTO public.designer_bank_details (
  designer_id,
  bank_account_holder_name,
  bank_account_number,
  bank_ifsc_code,
  bank_swift_code,
  bank_iban,
  bank_country,
  bank_details_verified
)
SELECT 
  id,
  bank_account_holder_name,
  bank_account_number,
  bank_ifsc_code,
  bank_swift_code,
  bank_iban,
  bank_country,
  bank_details_verified
FROM public.designer_profiles
WHERE bank_account_number IS NOT NULL OR bank_iban IS NOT NULL;

-- Remove bank columns from designer_profiles
ALTER TABLE public.designer_profiles 
  DROP COLUMN IF EXISTS bank_account_holder_name,
  DROP COLUMN IF EXISTS bank_account_number,
  DROP COLUMN IF EXISTS bank_ifsc_code,
  DROP COLUMN IF EXISTS bank_swift_code,
  DROP COLUMN IF EXISTS bank_iban,
  DROP COLUMN IF EXISTS bank_country,
  DROP COLUMN IF EXISTS bank_details_verified;

-- Create trigger for updated_at
CREATE TRIGGER update_designer_bank_details_updated_at
BEFORE UPDATE ON public.designer_bank_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();