CREATE TABLE public.social_scheduled_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_at timestamptz NOT NULL,
  slot_type text NOT NULL DEFAULT 'feed' CHECK (slot_type IN ('feed','story')),
  day_index int NOT NULL DEFAULT 1,
  theme text,
  caption text NOT NULL,
  image_prompt text NOT NULL,
  image_url text,
  is_render boolean NOT NULL DEFAULT true,
  engineering jsonb,
  engineering_status text NOT NULL DEFAULT 'pending' CHECK (engineering_status IN ('pending','pass','fail','skipped')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','ready','needs_review','publishing','published','failed','cancelled')),
  ig_media_id text,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX social_scheduled_posts_due_idx ON public.social_scheduled_posts (status, scheduled_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_scheduled_posts TO authenticated;
GRANT ALL ON public.social_scheduled_posts TO service_role;
ALTER TABLE public.social_scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scheduled posts" ON public.social_scheduled_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.social_scheduler_state (
  id text NOT NULL PRIMARY KEY DEFAULT 'default',
  paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  lease_until timestamptz,
  last_run_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.social_scheduler_state TO authenticated;
GRANT ALL ON public.social_scheduler_state TO service_role;
ALTER TABLE public.social_scheduler_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scheduler state" ON public.social_scheduler_state
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.social_scheduler_state (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TRIGGER update_social_scheduled_posts_updated_at
  BEFORE UPDATE ON public.social_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();