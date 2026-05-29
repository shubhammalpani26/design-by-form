
-- Design sessions: one per design conversation
CREATE TABLE public.design_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled design',
  active_image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_sessions TO authenticated;
GRANT ALL ON public.design_sessions TO service_role;

ALTER TABLE public.design_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own design sessions"
ON public.design_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all design sessions"
ON public.design_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER design_sessions_updated_at
BEFORE UPDATE ON public.design_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_design_sessions_user_updated
ON public.design_sessions(user_id, updated_at DESC);

-- Design messages: chat history within a session
CREATE TABLE public.design_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.design_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_messages TO authenticated;
GRANT ALL ON public.design_messages TO service_role;

ALTER TABLE public.design_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own design messages"
ON public.design_messages
FOR ALL
TO authenticated
USING (
  session_id IN (SELECT id FROM public.design_sessions WHERE user_id = auth.uid())
)
WITH CHECK (
  session_id IN (SELECT id FROM public.design_sessions WHERE user_id = auth.uid())
);

CREATE POLICY "Admins manage all design messages"
ON public.design_messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_design_messages_session_created
ON public.design_messages(session_id, created_at ASC);
