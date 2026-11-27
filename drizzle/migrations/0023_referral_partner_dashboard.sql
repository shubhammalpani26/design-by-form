CREATE TABLE public.referral_partners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL,
 organization text NOT NULL DEFAULT '', kind text NOT NULL DEFAULT 'business' CHECK (kind IN ('business','creator')),
 shipping_address jsonb NOT NULL DEFAULT '{}', pet_name text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_partners TO authenticated;
GRANT ALL ON public.referral_partners TO service_role;
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.referral_partners FOR SELECT TO authenticated USING ((select public.has_role((select auth.uid()), 'admin')));
CREATE UNIQUE INDEX referral_partners_email_idx ON public.referral_partners (lower(email));
CREATE TABLE public.referral_partner_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid NOT NULL REFERENCES public.referral_partners(id),
 promo_id uuid NOT NULL UNIQUE REFERENCES public.originals_promo_codes(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_partner_codes TO authenticated;
GRANT ALL ON public.referral_partner_codes TO service_role;
ALTER TABLE public.referral_partner_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.referral_partner_codes FOR SELECT TO authenticated USING ((select public.has_role((select auth.uid()), 'admin')));
CREATE INDEX referral_partner_codes_partner_idx ON public.referral_partner_codes(partner_id);
CREATE TABLE public.referral_partner_gifts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid NOT NULL REFERENCES public.referral_partners(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.originals_orders(id),
 shared_at timestamptz, sent_preview_url text, sent_model_url text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_partner_gifts TO authenticated;
GRANT ALL ON public.referral_partner_gifts TO service_role;
ALTER TABLE public.referral_partner_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.referral_partner_gifts FOR SELECT TO authenticated USING ((select public.has_role((select auth.uid()), 'admin')));
CREATE INDEX referral_partner_gifts_partner_idx ON public.referral_partner_gifts(partner_id);
CREATE TABLE public.referral_commissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid NOT NULL REFERENCES public.referral_partners(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.originals_orders(id), code text NOT NULL,
 rate numeric NOT NULL CHECK (rate IN (0.20,0.30)), basis_usd numeric NOT NULL, earned_usd numeric NOT NULL,
 state text NOT NULL DEFAULT 'pending_delivery' CHECK (state IN ('pending_delivery','delivered','void')),
 eligible_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_commissions TO authenticated;
GRANT ALL ON public.referral_commissions TO service_role;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.referral_commissions FOR SELECT TO authenticated USING ((select public.has_role((select auth.uid()), 'admin')));
CREATE INDEX referral_commissions_partner_idx ON public.referral_commissions(partner_id, eligible_at);
CREATE TABLE public.referral_partner_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), partner_id uuid NOT NULL REFERENCES public.referral_partners(id),
 period_month date NOT NULL, amount_usd numeric NOT NULL CHECK(amount_usd > 0),
 reference text NOT NULL, paid_at timestamptz NOT NULL DEFAULT now(), recorded_by uuid NOT NULL
);
GRANT SELECT ON public.referral_partner_payments TO authenticated;
GRANT ALL ON public.referral_partner_payments TO service_role;
ALTER TABLE public.referral_partner_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.referral_partner_payments FOR SELECT TO authenticated USING ((select public.has_role((select auth.uid()), 'admin')));
CREATE INDEX referral_partner_payments_partner_idx ON public.referral_partner_payments(partner_id, period_month);
CREATE FUNCTION public.sync_referral_commission(p_order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.originals_orders; c public.referral_commissions; pid uuid; r numeric;
BEGIN
 SELECT * INTO o FROM public.originals_orders WHERE id=p_order_id;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO c FROM public.referral_commissions WHERE order_id=o.id;
 IF FOUND THEN
   UPDATE public.referral_commissions SET
     state=CASE WHEN o.status NOT IN ('paid','fulfilled') OR o.amount_usd<=0 OR o.production_status='cancelled' THEN 'void'
       WHEN o.delivered_at IS NOT NULL OR o.production_status='delivered' THEN 'delivered' ELSE 'pending_delivery' END,
     eligible_at=coalesce(eligible_at, o.delivered_at, CASE WHEN o.production_status='delivered' THEN now() END),
     basis_usd=o.amount_usd, earned_usd=round(o.amount_usd*rate,2), updated_at=now() WHERE id=c.id;
   RETURN;
 END IF;
 IF o.status NOT IN ('paid','fulfilled') OR o.amount_usd<=0 OR o.payment_provider IN ('test','internal_test') OR o.production_status='cancelled' THEN RETURN; END IF;
 SELECT pc.partner_id INTO pid FROM public.referral_partner_codes pc JOIN public.originals_promo_codes p ON p.id=pc.promo_id WHERE upper(p.code)=upper(o.promo_code);
 IF pid IS NULL THEN RETURN; END IF;
 r=CASE WHEN o.size_key='statement' THEN 0.30 ELSE 0.20 END;
 INSERT INTO public.referral_commissions(partner_id,order_id,code,rate,basis_usd,earned_usd,state,eligible_at)
 VALUES(pid,o.id,upper(o.promo_code),r,o.amount_usd,round(o.amount_usd*r,2),
 CASE WHEN o.delivered_at IS NOT NULL OR o.production_status='delivered' THEN 'delivered' ELSE 'pending_delivery' END,
 coalesce(o.delivered_at, CASE WHEN o.production_status='delivered' THEN now() END)) ON CONFLICT(order_id) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.sync_referral_commission(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_referral_commission(uuid) TO service_role;
CREATE FUNCTION public.referral_order_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.sync_referral_commission(NEW.id); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.referral_order_changed() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER referral_order_changed AFTER INSERT OR UPDATE OF status,production_status,delivered_at,amount_usd,promo_code ON public.originals_orders FOR EACH ROW EXECUTE FUNCTION public.referral_order_changed();
CREATE FUNCTION public.admin_save_referral_partner(p_id uuid, p_name text, p_email text, p_organization text, p_kind text, p_address jsonb, p_pet_name text, p_notes text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF length(trim(p_name))=0 OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_kind NOT IN ('creator','business') THEN RAISE EXCEPTION 'Enter a name, valid email and partner type'; END IF;
 IF p_id IS NULL THEN
 INSERT INTO public.referral_partners(name,email,organization,kind,shipping_address,pet_name,notes) VALUES(trim(p_name),lower(trim(p_email)),p_organization,p_kind,p_address,p_pet_name,p_notes) RETURNING id INTO result;
 ELSE
 UPDATE public.referral_partners SET name=trim(p_name),email=lower(trim(p_email)),organization=p_organization,kind=p_kind,shipping_address=p_address,pet_name=p_pet_name,notes=p_notes,updated_at=now() WHERE id=p_id RETURNING id INTO result;
 IF result IS NULL THEN RAISE EXCEPTION 'Partner not found'; END IF;
 END IF;
 RETURN result;
END $$;
CREATE FUNCTION public.admin_add_referral_code(p_partner_id uuid,p_code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE partner public.referral_partners; promo public.originals_promo_codes; oid uuid; wanted numeric;
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 SELECT * INTO partner FROM public.referral_partners WHERE id=p_partner_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Partner not found'; END IF;
 p_code=upper(trim(p_code));
 IF p_code !~ '^[A-Z0-9][A-Z0-9_-]{2,39}$' OR p_code='NYZORA-INTERNAL' THEN RAISE EXCEPTION 'Use 3–40 letters, digits, dashes or underscores'; END IF;
 wanted=CASE WHEN partner.kind='creator' THEN 10 ELSE 5 END;
 PERFORM pg_advisory_xact_lock(hashtext(p_code));
 SELECT * INTO promo FROM public.originals_promo_codes WHERE upper(code)=p_code;
 IF FOUND THEN
 IF promo.percent_off IS DISTINCT FROM wanted OR coalesce(promo.amount_off_usd,0)<>0 OR promo.admin_only OR cardinality(promo.allowed_emails)>0 OR promo.blind_ship THEN RAISE EXCEPTION 'Existing code has different terms; choose a new code'; END IF;
 ELSE
 INSERT INTO public.originals_promo_codes(code,description,percent_off) VALUES(p_code,'Partner: '||partner.name,wanted) RETURNING * INTO promo;
 END IF;
 INSERT INTO public.referral_partner_codes(partner_id,promo_id) VALUES(p_partner_id,promo.id);
 FOR oid IN SELECT id FROM public.originals_orders WHERE upper(promo_code)=p_code LOOP PERFORM public.sync_referral_commission(oid); END LOOP;
END $$;
CREATE FUNCTION public.admin_link_referral_gift(p_partner_id uuid,p_order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.originals_orders WHERE id=p_order_id AND amount_usd=0 AND payment_provider IS DISTINCT FROM 'test') THEN RAISE EXCEPTION 'Choose a free gift order'; END IF;
 INSERT INTO public.referral_partner_gifts(partner_id,order_id) VALUES(p_partner_id,p_order_id);
END $$;
CREATE FUNCTION public.admin_record_referral_shared(p_gift_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 UPDATE public.referral_partner_gifts g SET shared_at=now(),sent_preview_url=o.preview_image_url,sent_model_url=o.print_file_url FROM public.originals_orders o WHERE g.id=p_gift_id AND o.id=g.order_id AND g.shared_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Files already recorded or gift missing'; END IF;
END $$;
CREATE FUNCTION public.admin_record_referral_payment(p_partner_id uuid,p_month date,p_amount numeric,p_reference text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE earnings numeric; paid numeric; balance numeric; result uuid;
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 PERFORM 1 FROM public.referral_partners WHERE id=p_partner_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Partner not found'; END IF;
 IF p_month<>date_trunc('month',p_month)::date OR p_month>=date_trunc('month',now() AT TIME ZONE 'UTC')::date THEN RAISE EXCEPTION 'Choose a completed month'; END IF;
 IF p_amount IS NULL OR p_amount<=0 OR p_amount<>round(p_amount,2) OR length(trim(p_reference))=0 THEN RAISE EXCEPTION 'Enter a positive payment and transfer reference'; END IF;
 SELECT coalesce(sum(earned_usd) FILTER(WHERE state='delivered'),0) INTO earnings FROM public.referral_commissions WHERE partner_id=p_partner_id AND eligible_at<(p_month+interval '1 month') AT TIME ZONE 'UTC';
 SELECT coalesce(sum(amount_usd),0) INTO paid FROM public.referral_partner_payments WHERE partner_id=p_partner_id;
 balance=earnings-paid;
 IF p_amount>balance THEN RAISE EXCEPTION 'Payment exceeds outstanding delivered earnings ($%)',balance; END IF;
 INSERT INTO public.referral_partner_payments(partner_id,period_month,amount_usd,reference,recorded_by) VALUES(p_partner_id,p_month,p_amount,trim(p_reference),(select auth.uid())) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_save_referral_partner(uuid,text,text,text,text,jsonb,text,text),public.admin_add_referral_code(uuid,text),public.admin_link_referral_gift(uuid,uuid),public.admin_record_referral_shared(uuid),public.admin_record_referral_payment(uuid,date,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_save_referral_partner(uuid,text,text,text,text,jsonb,text,text),public.admin_add_referral_code(uuid,text),public.admin_link_referral_gift(uuid,uuid),public.admin_record_referral_shared(uuid),public.admin_record_referral_payment(uuid,date,numeric,text) TO authenticated,service_role;
-- Backfill only real outreach recipients with an existing free order. No codes are invented or activated.
INSERT INTO public.referral_partners(name,email,organization,kind,shipping_address,pet_name)
SELECT DISTINCT ON(lower(o.customer_email)) coalesce(nullif(o.shipping_address->>'name',''),nullif(c.contact_name,''),c.org_name,o.customer_email),lower(o.customer_email),coalesce(c.org_name,''),CASE WHEN c.category_slug='petfluencers' THEN 'creator' ELSE 'business' END,o.shipping_address,coalesce(o.personalization->>'heading','')
FROM public.originals_orders o JOIN public.outreach_contacts c ON lower(c.email)=lower(o.customer_email)
WHERE o.amount_usd=0 AND o.payment_provider IS DISTINCT FROM 'test'
ORDER BY lower(o.customer_email),o.created_at DESC;
INSERT INTO public.referral_partner_gifts(partner_id,order_id)
SELECT p.id,o.id FROM public.referral_partners p JOIN public.originals_orders o ON lower(o.customer_email)=lower(p.email) WHERE o.amount_usd=0 AND o.payment_provider IS DISTINCT FROM 'test';