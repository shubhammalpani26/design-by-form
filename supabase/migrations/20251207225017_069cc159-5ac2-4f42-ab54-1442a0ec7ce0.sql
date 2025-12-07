-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models', 
  '3d-models', 
  true,
  52428800, -- 50MB limit
  ARRAY['model/gltf-binary', 'application/octet-stream', 'model/obj', 'model/stl', 'application/x-tgif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Allow authenticated users to upload 3D models
CREATE POLICY "Authenticated users can upload 3D models"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = '3d-models');

-- Allow public read access to 3D models
CREATE POLICY "Anyone can view 3D models"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = '3d-models');

-- Allow users to update their own 3D models
CREATE POLICY "Users can update own 3D models"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own 3D models
CREATE POLICY "Users can delete own 3D models"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);