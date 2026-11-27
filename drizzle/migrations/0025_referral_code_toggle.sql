CREATE OR REPLACE FUNCTION public.admin_set_referral_code_active(p_promo_id uuid, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.referral_partner_codes WHERE promo_id=p_promo_id) THEN RAISE EXCEPTION 'Not a partner code'; END IF;
 UPDATE public.originals_promo_codes SET active=p_active, updated_at=now() WHERE id=p_promo_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_referral_code_active(uuid,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_referral_code_active(uuid,boolean) TO authenticated;