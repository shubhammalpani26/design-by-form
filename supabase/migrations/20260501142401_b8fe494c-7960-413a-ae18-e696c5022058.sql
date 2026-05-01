-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_designer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'activated'
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_designer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_user_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Newly signed up user creates their own referral record
CREATE POLICY "Users can create their own referral record"
ON public.referrals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = referred_user_id);

-- Referrer (creator) can view referrals attributed to them
CREATE POLICY "Creators can view their referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (
  referrer_designer_id IN (
    SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()
  )
  OR auth.uid() = referred_user_id
);

-- Admins manage everything
CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp trigger
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function: award referrer 30 credits when referred user's first design gets approved
CREATE OR REPLACE FUNCTION public.award_referral_on_first_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_user_id UUID;
  v_referral RECORD;
  v_referrer_user_id UUID;
  v_prior_approved INTEGER;
BEGIN
  -- Only act on transition to approved
  IF NEW.status <> 'approved' OR (OLD.status IS NOT NULL AND OLD.status = 'approved') THEN
    RETURN NEW;
  END IF;

  -- Find the user behind this designer profile
  SELECT user_id INTO v_referred_user_id
  FROM public.designer_profiles
  WHERE id = NEW.designer_id;

  IF v_referred_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Is this their first ever approved design? (count other approved products by them)
  SELECT COUNT(*) INTO v_prior_approved
  FROM public.designer_products
  WHERE designer_id = NEW.designer_id
    AND status = 'approved'
    AND id <> NEW.id;

  IF v_prior_approved > 0 THEN
    RETURN NEW;
  END IF;

  -- Find a pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = v_referred_user_id
    AND status = 'pending'
  LIMIT 1;

  IF v_referral.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve referrer's user_id
  SELECT user_id INTO v_referrer_user_id
  FROM public.designer_profiles
  WHERE id = v_referral.referrer_designer_id;

  IF v_referrer_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Award 30 credits to referrer
  UPDATE public.user_credits
  SET balance = balance + 30,
      updated_at = now()
  WHERE user_id = v_referrer_user_id;

  -- Log credit transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
  VALUES (
    v_referrer_user_id,
    30,
    'referral_activation',
    'Referral activated: a creator you invited had their first design approved',
    jsonb_build_object('referral_id', v_referral.id, 'referred_user_id', v_referred_user_id, 'product_id', NEW.id)
  );

  -- Mark referral activated
  UPDATE public.referrals
  SET status = 'activated',
      credits_awarded = 30,
      activated_at = now(),
      updated_at = now()
  WHERE id = v_referral.id;

  -- Notify referrer
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    v_referrer_user_id,
    'referral_activated',
    '🎉 You earned 30 credits!',
    'A creator you referred just had their first design approved.',
    '/creator-dashboard',
    jsonb_build_object('referral_id', v_referral.id, 'credits', 30)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_referral_on_first_approval
AFTER INSERT OR UPDATE OF status ON public.designer_products
FOR EACH ROW
EXECUTE FUNCTION public.award_referral_on_first_approval();