INSERT INTO public.originals_print_models (sku_slug, size_key, stl_url, filament, notes)
VALUES (
  'pet-silhouette-keepsake',
  'petite',
  'https://rdcfakdhgndnhgzfkuvw.supabase.co/storage/v1/object/public/3d-models/test/partner-test-vase.stl',
  'PLA BLACK',
  'Placeholder master file used to verify live quoting — replace with the real petite bust STL.'
)
ON CONFLICT (sku_slug, size_key) DO UPDATE SET stl_url = EXCLUDED.stl_url, updated_at = now();