CREATE TABLE public.blocked_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text UNIQUE,
  user_id uuid UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_visitors TO authenticated;
GRANT ALL ON public.blocked_visitors TO service_role;
ALTER TABLE public.blocked_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocked visitors" ON public.blocked_visitors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.blocked_visitors (ip_hash, reason)
VALUES ('113fa4c99b7e48fbfee72aae40bcbd8a2efb4d014ebd12f5a8f324ac3f62c312', 'Obscene uploads — blocked by admin 2026-09-27');

CREATE POLICY "Admins delete originals uploads" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'originals-uploads' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete originals preview renders" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND name LIKE 'originals/preview/%' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins list originals preview renders" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND name LIKE 'originals/preview/%' AND public.has_role(auth.uid(),'admin'));

DELETE FROM public.print_validation_events WHERE preview_id IN (SELECT id FROM public.originals_previews WHERE ip_hash = '113fa4c99b7e48fbfee72aae40bcbd8a2efb4d014ebd12f5a8f324ac3f62c312');
DELETE FROM public.originals_previews WHERE ip_hash = '113fa4c99b7e48fbfee72aae40bcbd8a2efb4d014ebd12f5a8f324ac3f62c312';