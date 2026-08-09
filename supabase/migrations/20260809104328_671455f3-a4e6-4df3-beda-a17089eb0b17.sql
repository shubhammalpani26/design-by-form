CREATE TABLE IF NOT EXISTS public.user_connector_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_defaults jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_connector_tokens TO authenticated;
GRANT ALL ON public.user_connector_tokens TO service_role;

ALTER TABLE public.user_connector_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own connector tokens"
ON public.user_connector_tokens
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());