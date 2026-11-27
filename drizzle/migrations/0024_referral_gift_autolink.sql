CREATE OR REPLACE FUNCTION public.referral_order_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid; contact public.outreach_contacts;
BEGIN
 IF NEW.amount_usd=0 AND NEW.payment_provider IS DISTINCT FROM 'test' AND NEW.customer_email IS NOT NULL THEN
  SELECT id INTO pid FROM public.referral_partners WHERE lower(email)=lower(NEW.customer_email);
  IF pid IS NULL THEN
   SELECT * INTO contact FROM public.outreach_contacts WHERE lower(email)=lower(NEW.customer_email) LIMIT 1;
   IF FOUND THEN
    INSERT INTO public.referral_partners(name,email,organization,kind,shipping_address,pet_name)
    VALUES(coalesce(nullif(NEW.shipping_address->>'name',''),nullif(contact.contact_name,''),contact.org_name,NEW.customer_email),lower(NEW.customer_email),coalesce(contact.org_name,''),CASE WHEN contact.category_slug='petfluencers' THEN 'creator' ELSE 'business' END,coalesce(NEW.shipping_address,'{}'),coalesce(NEW.personalization->>'heading',''))
    ON CONFLICT(lower(email)) DO NOTHING RETURNING id INTO pid;
    IF pid IS NULL THEN SELECT id INTO pid FROM public.referral_partners WHERE lower(email)=lower(NEW.customer_email); END IF;
   END IF;
  END IF;
  IF pid IS NOT NULL THEN INSERT INTO public.referral_partner_gifts(partner_id,order_id) VALUES(pid,NEW.id) ON CONFLICT(order_id) DO NOTHING; END IF;
 END IF;
 PERFORM public.sync_referral_commission(NEW.id); RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.admin_save_referral_partner(p_id uuid, p_name text, p_email text, p_organization text, p_kind text, p_address jsonb, p_pet_name text, p_notes text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF NOT public.has_role((select auth.uid()),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF p_name IS NULL OR p_email IS NULL OR p_kind IS NULL OR length(trim(p_name))=0 OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_kind NOT IN ('creator','business') THEN RAISE EXCEPTION 'Enter a name, valid email and partner type'; END IF;
 IF p_id IS NULL THEN
 INSERT INTO public.referral_partners(name,email,organization,kind,shipping_address,pet_name,notes) VALUES(trim(p_name),lower(trim(p_email)),p_organization,p_kind,p_address,p_pet_name,p_notes) RETURNING id INTO result;
 ELSE
 UPDATE public.referral_partners SET name=trim(p_name),email=lower(trim(p_email)),organization=p_organization,kind=p_kind,shipping_address=p_address,pet_name=p_pet_name,notes=p_notes,updated_at=now() WHERE id=p_id RETURNING id INTO result;
 IF result IS NULL THEN RAISE EXCEPTION 'Partner not found'; END IF;
 END IF;
 INSERT INTO public.referral_partner_gifts(partner_id,order_id) SELECT result,id FROM public.originals_orders WHERE lower(customer_email)=lower(trim(p_email)) AND amount_usd=0 AND payment_provider IS DISTINCT FROM 'test' ON CONFLICT(order_id) DO NOTHING;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.sync_referral_commission(p_order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.originals_orders; c public.referral_commissions; pid uuid; r numeric;
BEGIN
 SELECT * INTO o FROM public.originals_orders WHERE id=p_order_id;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO c FROM public.referral_commissions WHERE order_id=o.id;
 IF FOUND THEN
   PERFORM 1 FROM public.referral_partners WHERE id=c.partner_id FOR UPDATE;
   UPDATE public.referral_commissions SET
     state=CASE WHEN o.status NOT IN ('paid','fulfilled') OR o.amount_usd<=0 OR o.payment_provider IN ('test','internal_test') OR o.production_status='cancelled' THEN 'void'
       WHEN o.delivered_at IS NOT NULL OR o.production_status='delivered' THEN 'delivered' ELSE 'pending_delivery' END,
     eligible_at=coalesce(eligible_at, o.delivered_at, CASE WHEN o.production_status='delivered' THEN now() END),
     basis_usd=o.amount_usd, earned_usd=round(o.amount_usd*rate,2), updated_at=now() WHERE id=c.id;
   RETURN;
 END IF;
 IF o.status NOT IN ('paid','fulfilled') OR o.amount_usd<=0 OR o.payment_provider IN ('test','internal_test') OR o.production_status='cancelled' THEN RETURN; END IF;
 SELECT pc.partner_id INTO pid FROM public.referral_partner_codes pc JOIN public.originals_promo_codes p ON p.id=pc.promo_id WHERE upper(p.code)=upper(o.promo_code);
 IF pid IS NULL THEN RETURN; END IF;
 PERFORM 1 FROM public.referral_partners WHERE id=pid FOR UPDATE;
 r=CASE WHEN o.size_key='statement' THEN 0.30 ELSE 0.20 END;
 INSERT INTO public.referral_commissions(partner_id,order_id,code,rate,basis_usd,earned_usd,state,eligible_at)
 VALUES(pid,o.id,upper(o.promo_code),r,o.amount_usd,round(o.amount_usd*r,2),
 CASE WHEN o.delivered_at IS NOT NULL OR o.production_status='delivered' THEN 'delivered' ELSE 'pending_delivery' END,
 coalesce(o.delivered_at, CASE WHEN o.production_status='delivered' THEN now() END)) ON CONFLICT(order_id) DO NOTHING;
END $$;