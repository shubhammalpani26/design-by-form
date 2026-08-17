update public.social_scheduled_posts
set image_url = null, status = 'scheduled', attempts = 0, engineering = null,
    engineering_status = 'pending', last_error = null
where is_render = true and status not in ('published','cancelled');