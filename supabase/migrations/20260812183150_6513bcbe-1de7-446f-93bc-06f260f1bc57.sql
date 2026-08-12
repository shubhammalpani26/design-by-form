CREATE TABLE public.experiment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment text NOT NULL,
  variant text NOT NULL,
  event text NOT NULL,
  session_id text NOT NULL,
  sku_slug text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX experiment_events_lookup_idx ON public.experiment_events (experiment, variant, event, created_at DESC);
CREATE INDEX experiment_events_session_idx ON public.experiment_events (session_id, created_at DESC);

GRANT INSERT ON public.experiment_events TO anon;
GRANT INSERT ON public.experiment_events TO authenticated;
GRANT ALL ON public.experiment_events TO service_role;

ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an experiment event"
  ON public.experiment_events FOR INSERT
  WITH CHECK (
    length(experiment) <= 64
    AND length(variant) <= 64
    AND length(event) <= 64
    AND length(session_id) <= 64
    AND (sku_slug IS NULL OR length(sku_slug) <= 128)
    AND pg_column_size(metadata) <= 2048
  );

CREATE POLICY "Admins can read experiment events"
  ON public.experiment_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));