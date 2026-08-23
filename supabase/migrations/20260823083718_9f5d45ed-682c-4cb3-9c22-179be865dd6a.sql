CREATE TABLE public.partner_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  originals_order_id uuid REFERENCES public.originals_orders(id) ON DELETE SET NULL,
  group_id uuid,
  partner_order_id text,
  source text NOT NULL DEFAULT 'internal',
  stage text NOT NULL,
  event text NOT NULL,
  status text,
  message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partner_order_events TO authenticated;
GRANT ALL ON public.partner_order_events TO service_role;

ALTER TABLE public.partner_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view partner order events"
ON public.partner_order_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_partner_order_events_order ON public.partner_order_events (originals_order_id, occurred_at DESC);
CREATE INDEX idx_partner_order_events_partner ON public.partner_order_events (partner_order_id, occurred_at DESC);
CREATE INDEX idx_partner_order_events_group ON public.partner_order_events (group_id, occurred_at DESC);