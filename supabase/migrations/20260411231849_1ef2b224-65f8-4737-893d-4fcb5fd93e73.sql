
CREATE TABLE public.early_access_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  whatsapp TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT email_or_whatsapp CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
);

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit early access signup"
ON public.early_access_signups
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all signups"
ON public.early_access_signups
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
