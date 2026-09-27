CREATE OR REPLACE FUNCTION public.admin_delete_originals_preview(p_preview_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_source_path text;
  v_preview_url text;
  v_render_path text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete customer previews.';
  END IF;

  SELECT source_image_url, preview_image_url
    INTO v_source_path, v_preview_url
    FROM public.originals_previews
   WHERE id = p_preview_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Preview not found.';
  END IF;

  -- Remove the uploaded photo from the private bucket.
  IF v_source_path IS NOT NULL AND v_source_path <> '' THEN
    DELETE FROM storage.objects
     WHERE bucket_id = 'originals-uploads' AND name = v_source_path;
  END IF;

  -- Remove the render from the public bucket (stored as a full public URL).
  IF v_preview_url IS NOT NULL AND v_preview_url LIKE '%/product-images/%' THEN
    v_render_path := split_part(v_preview_url, '/product-images/', 2);
    IF v_render_path <> '' THEN
      DELETE FROM storage.objects
       WHERE bucket_id = 'product-images' AND name = v_render_path;
    END IF;
  END IF;

  DELETE FROM public.print_validation_events WHERE preview_id = p_preview_id;
  DELETE FROM public.originals_previews WHERE id = p_preview_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_originals_preview(uuid) TO authenticated;