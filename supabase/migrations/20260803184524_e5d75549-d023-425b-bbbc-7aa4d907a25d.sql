ALTER TABLE public.designer_profiles ADD COLUMN IF NOT EXISTS is_house boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.block_house_payout_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.designer_profiles p WHERE p.id = NEW.designer_id AND p.is_house) THEN
    RAISE EXCEPTION 'House (Nyzora Originals) earnings are not payout-eligible';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_house_payout_requests ON public.payout_requests;
CREATE TRIGGER trg_block_house_payout_requests
BEFORE INSERT ON public.payout_requests
FOR EACH ROW EXECUTE FUNCTION public.block_house_payout_requests();