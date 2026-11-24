ALTER TABLE public.outreach_contacts
  ADD COLUMN IF NOT EXISTS followup_status text,
  ADD COLUMN IF NOT EXISTS followup_subject text,
  ADD COLUMN IF NOT EXISTS followup_body text,
  ADD COLUMN IF NOT EXISTS followup_scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_message_id text,
  ADD COLUMN IF NOT EXISTS followup_error text;

ALTER TABLE public.outreach_contacts DROP CONSTRAINT IF EXISTS outreach_contacts_followup_status_check;
ALTER TABLE public.outreach_contacts ADD CONSTRAINT outreach_contacts_followup_status_check
  CHECK (followup_status IS NULL OR followup_status IN ('scheduled','sending','sent','failed','cancelled'));

CREATE INDEX IF NOT EXISTS outreach_contacts_followup_due_idx
  ON public.outreach_contacts (followup_scheduled_for) WHERE followup_status = 'scheduled';

CREATE OR REPLACE FUNCTION public.claim_outreach_followups_due(p_limit integer)
RETURNS SETOF public.outreach_contacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Anyone who replied, opted out or bounced since queueing is dropped, never sent.
  UPDATE public.outreach_contacts SET followup_status = 'cancelled', updated_at = now()
  WHERE followup_status = 'scheduled' AND status <> 'sent';

  RETURN QUERY
  UPDATE public.outreach_contacts c SET followup_status = 'sending', updated_at = now()
  WHERE c.id IN (
    SELECT id FROM public.outreach_contacts
    WHERE followup_status = 'scheduled' AND followup_scheduled_for <= now()
      AND status = 'sent' AND followup_sent_at IS NULL
    ORDER BY followup_scheduled_for
    LIMIT greatest(0, least(p_limit, 50))
    FOR UPDATE SKIP LOCKED
  )
  RETURNING c.*;
END $function$;

REVOKE ALL ON FUNCTION public.claim_outreach_followups_due(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_outreach_followups_due(integer) TO service_role;