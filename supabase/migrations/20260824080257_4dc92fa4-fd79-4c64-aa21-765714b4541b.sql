CREATE TABLE public.print_validation_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preview_id uuid REFERENCES public.originals_previews(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.designer_products(id) ON DELETE SET NULL,
  sku_slug text,
  size_key text,
  stage text NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  score integer,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  blockers jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  repaired boolean NOT NULL DEFAULT false,
  repair_summary jsonb,
  model_task_id text,
  model_url text,
  print_file_url text,
  engineering jsonb,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_print_validation_events_created_at ON public.print_validation_events (created_at DESC);
CREATE INDEX idx_print_validation_events_preview ON public.print_validation_events (preview_id);

GRANT SELECT ON public.print_validation_events TO authenticated;
GRANT ALL ON public.print_validation_events TO service_role;

ALTER TABLE public.print_validation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view print validation events"
ON public.print_validation_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));