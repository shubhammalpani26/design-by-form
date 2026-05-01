-- Manufacturing Intelligence: capture every signal from production so new designs learn from completed orders
CREATE TABLE public.manufacturing_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref TEXT,
  product_id UUID,
  product_name TEXT NOT NULL,
  creator_name TEXT,
  maker TEXT NOT NULL,
  process TEXT NOT NULL,           -- e.g. '3D printed + hand finished', 'Solid wood + hand finished'
  category TEXT,
  stage TEXT NOT NULL,             -- 'geometry' | 'routing' | 'production' | 'qc' | 'design_input'
  signal TEXT NOT NULL,            -- short label of what was measured
  value TEXT NOT NULL,             -- measured outcome (human readable)
  learning TEXT,                   -- distilled lesson the AI should remember
  confidence INTEGER NOT NULL DEFAULT 90 CHECK (confidence BETWEEN 0 AND 100),
  source TEXT NOT NULL DEFAULT 'production', -- 'production' | 'design_generation'
  metadata JSONB DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mi_stage_captured ON public.manufacturing_intelligence (stage, captured_at DESC);
CREATE INDEX idx_mi_maker ON public.manufacturing_intelligence (maker);
CREATE INDEX idx_mi_category ON public.manufacturing_intelligence (category);

ALTER TABLE public.manufacturing_intelligence ENABLE ROW LEVEL SECURITY;

-- Public can read learnings (proof of intelligence on the Technology page / counters)
CREATE POLICY "Anyone can view manufacturing intelligence"
  ON public.manufacturing_intelligence FOR SELECT
  USING (true);

-- Only admins can manage rows directly; edge functions use service role and bypass RLS
CREATE POLICY "Admins can manage manufacturing intelligence"
  ON public.manufacturing_intelligence FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));