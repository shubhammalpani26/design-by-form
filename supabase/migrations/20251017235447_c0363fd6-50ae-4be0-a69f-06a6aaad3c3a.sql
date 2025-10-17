-- Add phone number to designer profiles for order notifications
ALTER TABLE public.designer_profiles
ADD COLUMN phone_number TEXT;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.designer_profiles.phone_number IS 'Phone number for order notifications';