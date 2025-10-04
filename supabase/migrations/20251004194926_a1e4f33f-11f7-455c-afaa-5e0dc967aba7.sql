-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create designer profiles table
CREATE TABLE public.designer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio_url TEXT,
  design_background TEXT,
  furniture_interests TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission tiers table
CREATE TABLE public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_sales INTEGER NOT NULL,
  max_sales INTEGER,
  commission_rate DECIMAL(5,2) NOT NULL,
  tier_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default commission tiers
INSERT INTO public.commission_tiers (min_sales, max_sales, commission_rate, tier_name) VALUES
  (0, 10, 5.00, 'Starter'),
  (11, 25, 8.00, 'Bronze'),
  (26, 50, 12.00, 'Silver'),
  (51, 100, 15.00, 'Gold'),
  (101, NULL, 20.00, 'Platinum');

-- Create designer products table
CREATE TABLE public.designer_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  designer_id UUID NOT NULL REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  designer_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  total_sales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT designer_price_check CHECK (designer_price >= base_price)
);

-- Create sales tracking table
CREATE TABLE public.product_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.designer_products(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
  sale_price DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  designer_markup DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  designer_earnings DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.designer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for designer_profiles
CREATE POLICY "Designers can view their own profile"
  ON public.designer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create designer profile"
  ON public.designer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Designers can update their own profile"
  ON public.designer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for commission_tiers (public read)
CREATE POLICY "Anyone can view commission tiers"
  ON public.commission_tiers FOR SELECT
  USING (true);

-- RLS Policies for designer_products
CREATE POLICY "Anyone can view approved products"
  ON public.designer_products FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Designers can view their own products"
  ON public.designer_products FOR SELECT
  USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Designers can create products"
  ON public.designer_products FOR INSERT
  WITH CHECK (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Designers can update their own products"
  ON public.designer_products FOR UPDATE
  USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

-- RLS Policies for product_sales
CREATE POLICY "Designers can view their own sales"
  ON public.product_sales FOR SELECT
  USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_designer_profiles_updated_at
  BEFORE UPDATE ON public.designer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designer_products_updated_at
  BEFORE UPDATE ON public.designer_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();