-- Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;

-- Add updated check constraint with customization_request type
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['product_approval'::text, 'product_rejection'::text, 'sale'::text, 'payout'::text, 'info'::text, 'customization_request'::text]));