REVOKE EXECUTE ON FUNCTION public.redeem_originals_promo(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_originals_promo(text) TO service_role;