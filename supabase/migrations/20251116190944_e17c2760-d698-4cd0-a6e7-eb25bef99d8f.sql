-- Add profile picture URL to designer profiles
ALTER TABLE public.designer_profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create storage bucket for creator profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-profiles', 'creator-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile picture
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'creator-profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile picture
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'creator-profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "Anyone can view creator profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'creator-profiles');