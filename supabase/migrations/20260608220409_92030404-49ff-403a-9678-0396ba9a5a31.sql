
-- designer_products: hide internal fields from anon
REVOKE SELECT (base_price, pricing_reasoning, pricing_per_cubic_foot, rejection_reason, original_designer_price, current_discount_level) ON public.designer_products FROM anon;

-- designer_profiles: hide user_id from anon (email/phone already revoked)
REVOKE SELECT (user_id) ON public.designer_profiles FROM anon;

-- feed_post_likes / feed_post_saves: hide user_id from anon
REVOKE SELECT (user_id) ON public.feed_post_likes FROM anon;
REVOKE SELECT (user_id) ON public.feed_post_saves FROM anon;
