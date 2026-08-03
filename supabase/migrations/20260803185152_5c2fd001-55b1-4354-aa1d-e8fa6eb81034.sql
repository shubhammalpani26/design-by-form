CREATE OR REPLACE FUNCTION public.set_default_lead_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_default INTEGER;
BEGIN
  v_default := CASE WHEN NEW.manufacturing_method = 'fdm_us' THEN 7 ELSE 21 END;

  IF TG_OP = 'INSERT' THEN
    IF NEW.lead_time_days IS NULL THEN
      NEW.lead_time_days := v_default;
    END IF;
  ELSIF NEW.manufacturing_method IS DISTINCT FROM OLD.manufacturing_method THEN
    -- Only auto-adjust when the old value was the other route's default (i.e. not customised)
    IF NEW.lead_time_days IS NULL
       OR NEW.lead_time_days = (CASE WHEN OLD.manufacturing_method = 'fdm_us' THEN 7 ELSE 21 END) THEN
      NEW.lead_time_days := v_default;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_default_lead_time ON public.designer_products;
CREATE TRIGGER trg_set_default_lead_time
BEFORE INSERT OR UPDATE ON public.designer_products
FOR EACH ROW EXECUTE FUNCTION public.set_default_lead_time();