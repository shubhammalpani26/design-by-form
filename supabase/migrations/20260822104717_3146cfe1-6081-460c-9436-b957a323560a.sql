DROP POLICY IF EXISTS "Authenticated users can upload 3D models" ON storage.objects;

CREATE POLICY "Authenticated users can upload own 3D models"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '3d-models'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Creator contact details stay non-readable publicly (column privileges already
-- exclude email/phone_number); rename policy so intent is unambiguous.
DROP POLICY IF EXISTS "Anyone can view approved designer profiles (safe columns)" ON public.designer_profiles;

CREATE POLICY "Public can view approved creator profiles (non-contact columns only)"
ON public.designer_profiles
FOR SELECT
USING (status = 'approved');

REVOKE SELECT (email, phone_number) ON public.designer_profiles FROM anon, authenticated;