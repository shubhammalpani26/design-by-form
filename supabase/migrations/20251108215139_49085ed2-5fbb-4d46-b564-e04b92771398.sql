-- Allow anyone to view approved designer profiles (for displaying designer names on products)
CREATE POLICY "Anyone can view approved designer profiles"
ON public.designer_profiles
FOR SELECT
USING (status = 'approved');