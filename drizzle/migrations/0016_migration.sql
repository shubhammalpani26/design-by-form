-- Founder outreach (cold email) panel: categories, contacts, settings.
CREATE TABLE public.outreach_categories (
  slug text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'business', -- 'creator' | 'business'
  daily_share integer NOT NULL DEFAULT 0,
  offer text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_categories TO authenticated;
GRANT ALL ON public.outreach_categories TO service_role;
ALTER TABLE public.outreach_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage outreach categories" ON public.outreach_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.outreach_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.outreach_categories(slug) ON UPDATE CASCADE,
  email text NOT NULL,
  contact_name text,
  org_name text,
  website text,
  instagram text,
  city text,
  state text,
  followers integer,
  personal_detail text,
  source_url text,
  source text NOT NULL DEFAULT 'import',
  status text NOT NULL DEFAULT 'new', -- new, selected, drafted, scheduled, sending, sent, replied, opted_out, bounced, skipped, failed
  outcome text, -- yes | no (founder's manual mark)
  batch_id uuid,
  subject text,
  body text,
  drafted_at timestamptz,
  scheduled_for timestamptz,
  sent_at timestamptz,
  gmail_message_id text,
  gmail_thread_id text,
  replied_at timestamptz,
  reply_snippet text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX outreach_contacts_email_key ON public.outreach_contacts (lower(email));
CREATE INDEX outreach_contacts_status_idx ON public.outreach_contacts (status, category_slug);
CREATE INDEX outreach_contacts_due_idx ON public.outreach_contacts (scheduled_for) WHERE status = 'scheduled';
CREATE INDEX outreach_contacts_thread_idx ON public.outreach_contacts (gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_contacts TO authenticated;
GRANT ALL ON public.outreach_contacts TO service_role;
ALTER TABLE public.outreach_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage outreach contacts" ON public.outreach_contacts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER outreach_contacts_updated_at BEFORE UPDATE ON public.outreach_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outreach_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_total integer NOT NULL DEFAULT 25,
  wave_size integer NOT NULL DEFAULT 20,
  paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  last_sync_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.outreach_settings TO authenticated;
GRANT ALL ON public.outreach_settings TO service_role;
ALTER TABLE public.outreach_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage outreach settings" ON public.outreach_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.outreach_settings (id) VALUES (1);

-- Atomically claim due scheduled emails so two runs never send the same one.
CREATE OR REPLACE FUNCTION public.claim_outreach_due(p_limit integer)
RETURNS SETOF public.outreach_contacts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE public.outreach_contacts c SET status = 'sending', updated_at = now()
  WHERE c.id IN (
    SELECT id FROM public.outreach_contacts
    WHERE status = 'scheduled' AND scheduled_for <= now()
    ORDER BY scheduled_for
    LIMIT greatest(0, least(p_limit, 50))
    FOR UPDATE SKIP LOCKED
  )
  RETURNING c.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_outreach_due(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_outreach_due(integer) TO service_role;

INSERT INTO public.outreach_categories (slug, name, kind, daily_share, sort, offer) VALUES
('petfluencers', 'Petfluencers', 'creator', 10, 1,
 'A free personalised Petite sculpture of their pet. Ask for one honest photo or video shared as an Instagram Collab post with @nyzora and #gifted, and permission to reshare on our page and website with credit (organic only, no paid ads). They get their own code: 10% off for followers and 10% commission to them on every order for as long as the code is live, plus a second free piece of any size at 10 orders. We are choosing our first 30 creator partners this month (true, may grow).'),
('pet_boutiques', 'Pet boutiques & gift shops', 'business', 5, 2,
 'A free display sculpture for their counter, made from a photo of the shop pet or a favourite regular. No cost and no commitment. If their customers ask about it, we would love to talk about working together.'),
('vet_groomers', 'Vet clinics & groomers', 'business', 5, 3,
 'A free display sculpture for their front desk, made from a photo of the clinic or salon pet (or a staff member''s pet). No cost and no commitment. If clients ask about it, we would love to talk about working together.'),
('memorial_stores', 'Pet memorial stores', 'business', 5, 4,
 'Business-to-business: a free display sculpture for their shop or website photos, made from a photo of a pet they choose. Nyzora pieces celebrate a pet''s life and could sit beside their range. No cost and no commitment. Never write as if the reader is grieving.');