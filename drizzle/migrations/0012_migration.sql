CREATE TABLE public.originals_preview_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preview_id uuid NOT NULL REFERENCES public.originals_previews(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(18), 'hex'),
  sku_slug text NOT NULL,
  ip_hash text,
  user_id uuid,
  color_key text,
  size_key text,
  sent_at timestamptz,
  reminder_due_at timestamptz NOT NULL,
  reminder_sent_at timestamptz,
  reminder_skipped_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (preview_id, email)
);

CREATE INDEX originals_preview_emails_due_idx
  ON public.originals_preview_emails (reminder_due_at)
  WHERE reminder_sent_at IS NULL AND reminder_skipped_reason IS NULL;
CREATE INDEX originals_preview_emails_email_idx ON public.originals_preview_emails (email, created_at);
CREATE INDEX originals_preview_emails_ip_idx ON public.originals_preview_emails (ip_hash, created_at);

GRANT SELECT ON public.originals_preview_emails TO authenticated;
GRANT ALL ON public.originals_preview_emails TO service_role;

ALTER TABLE public.originals_preview_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read preview email opt-ins"
  ON public.originals_preview_emails
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));