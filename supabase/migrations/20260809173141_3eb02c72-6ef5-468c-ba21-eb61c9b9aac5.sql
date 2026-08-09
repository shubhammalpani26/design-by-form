CREATE TABLE public.agent_learnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill TEXT NOT NULL DEFAULT 'ceo-orchestrator',
  kind TEXT NOT NULL DEFAULT 'feedback',
  topic TEXT,
  context TEXT,
  feedback TEXT NOT NULL,
  learning TEXT,
  weight INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_learnings_skill_active ON public.agent_learnings (skill, active, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_learnings TO authenticated;
GRANT ALL ON public.agent_learnings TO service_role;

ALTER TABLE public.agent_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agent learnings"
ON public.agent_learnings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agent_learnings_updated_at
BEFORE UPDATE ON public.agent_learnings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();