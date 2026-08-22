ALTER TABLE public.originals_previews
  ADD COLUMN IF NOT EXISTS print_files jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS feasibility jsonb;