-- Create user credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 10,
  free_credits_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'monthly_reset', 'bonus')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create design listings table (for marketplace listing fees)
CREATE TABLE public.design_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.designer_products(id) ON DELETE CASCADE,
  listing_fee_paid BOOLEAN NOT NULL DEFAULT false,
  listing_fee_amount NUMERIC(10,2),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  featured_fee_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create designer earnings table
CREATE TABLE public.designer_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.designer_products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  sale_amount NUMERIC(10,2) NOT NULL,
  royalty_percentage NUMERIC(5,2) NOT NULL DEFAULT 7.00,
  royalty_amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AR sessions table
CREATE TABLE public.ar_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.designer_products(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('free', 'paid', 'studio')),
  room_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('forma_pro')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage analytics table
CREATE TABLE public.usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('ai_generation', '3d_generation', 'ar_view', 'design_save', 'design_list', 'purchase')),
  product_id UUID REFERENCES public.designer_products(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing config table
CREATE TABLE public.pricing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing configuration
INSERT INTO public.pricing_config (config_key, config_value) VALUES
('credit_packages', '{
  "basic": {"credits": 10, "price": 299},
  "standard": {"credits": 20, "price": 499},
  "premium": {"credits": 50, "price": 999}
}'::jsonb),
('pricing', '{
  "ai_generation_credit": 1,
  "model_3d_price": 300,
  "listing_fee": 499,
  "featured_listing_fee": 999,
  "ar_visualization_price": 99,
  "commission_rate": 0.20,
  "designer_royalty_rate": 0.07,
  "subscription_monthly": 1499,
  "free_monthly_credits": 10
}'::jsonb);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (true);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for design_listings
CREATE POLICY "Anyone can view listings"
  ON public.design_listings FOR SELECT
  USING (true);

CREATE POLICY "Designers can manage their listings"
  ON public.design_listings FOR ALL
  USING (product_id IN (
    SELECT id FROM designer_products 
    WHERE designer_id IN (
      SELECT id FROM designer_profiles WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for designer_earnings
CREATE POLICY "Designers can view their earnings"
  ON public.designer_earnings FOR SELECT
  USING (designer_id IN (
    SELECT id FROM designer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage earnings"
  ON public.designer_earnings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert earnings"
  ON public.designer_earnings FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ar_sessions
CREATE POLICY "Users can view their own AR sessions"
  ON public.ar_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create AR sessions"
  ON public.ar_sessions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (true);

-- RLS Policies for usage_analytics
CREATE POLICY "Users can view their own analytics"
  ON public.usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
  ON public.usage_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert analytics"
  ON public.usage_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for pricing_config
CREATE POLICY "Anyone can view pricing config"
  ON public.pricing_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pricing config"
  ON public.pricing_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_design_listings_product_id ON public.design_listings(product_id);
CREATE INDEX idx_designer_earnings_designer_id ON public.designer_earnings(designer_id);
CREATE INDEX idx_designer_earnings_status ON public.designer_earnings(status);
CREATE INDEX idx_ar_sessions_user_id ON public.ar_sessions(user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_action_type ON public.usage_analytics(action_type);

-- Create function to automatically create user credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, free_credits_reset_at)
  VALUES (
    NEW.id,
    10,
    date_trunc('month', now()) + interval '1 month'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- Create function to reset free credits monthly
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_credits
  SET 
    balance = balance + 10,
    free_credits_reset_at = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  WHERE free_credits_reset_at <= now();
  
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  SELECT 
    user_id,
    10,
    'monthly_reset',
    'Monthly free credits reset'
  FROM public.user_credits
  WHERE free_credits_reset_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;