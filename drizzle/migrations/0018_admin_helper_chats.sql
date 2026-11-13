CREATE TABLE public.admin_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helper text NOT NULL CHECK (helper IN ('social', 'ads')),
  msg_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (helper, msg_id)
);
CREATE INDEX admin_agent_messages_helper_created ON public.admin_agent_messages (helper, created_at);
GRANT SELECT, DELETE ON public.admin_agent_messages TO authenticated;
GRANT ALL ON public.admin_agent_messages TO service_role;
ALTER TABLE public.admin_agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read helper chats" ON public.admin_agent_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins clear helper chats" ON public.admin_agent_messages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.admin_agent_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helper text NOT NULL CHECK (helper IN ('social', 'ads')),
  note text NOT NULL CHECK (char_length(note) BETWEEN 3 AND 500),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admin_agent_notes TO authenticated;
GRANT ALL ON public.admin_agent_notes TO service_role;
ALTER TABLE public.admin_agent_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read helper notes" ON public.admin_agent_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins edit helper notes" ON public.admin_agent_notes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));