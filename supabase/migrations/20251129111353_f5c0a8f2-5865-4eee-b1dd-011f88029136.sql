-- Update the create_product_launch_post function to use "New Product Launch"
CREATE OR REPLACE FUNCTION public.create_product_launch_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create post when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.feed_posts (
      designer_id,
      post_type,
      title,
      content,
      metadata,
      image_url
    ) VALUES (
      NEW.designer_id,
      'product_launch',
      'New Product Launch',
      'Just launched ' || NEW.name || '! Check out this unique piece.',
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.name,
        'category', NEW.category,
        'price', NEW.designer_price
      ),
      NEW.image_url
    );
  END IF;
  RETURN NEW;
END;
$function$;