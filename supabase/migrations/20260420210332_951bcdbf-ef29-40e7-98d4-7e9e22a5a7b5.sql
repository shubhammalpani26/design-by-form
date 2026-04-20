UPDATE public.designer_profiles
SET 
  design_background = 'I am Mihir Shah, a product and furniture design enthusiast with a strong interest in how everyday objects shape the spaces we live in. My approach blends clean geometric forms with warm, tactile materials — designing pieces that feel grounded, intentional, and quietly modern. I am especially interested in modular and multi-functional furniture that adapts to evolving urban lifestyles, and I enjoy experimenting with how subtle proportions and finishes can transform the character of a room.',
  furniture_interests = 'I love designing seating, side tables, and accent pieces that strike a balance between minimalism and personality. My focus is on contemporary forms with a sculptural edge — chairs, stools, consoles, and lighting objects that work as both functional furniture and visual anchors in a space. I am particularly drawn to exploring sustainable materials and resin-based finishes that bring depth and craftsmanship to modern interiors.',
  portfolio_url = COALESCE(portfolio_url, 'https://www.behance.net/iammihir014'),
  updated_at = now()
WHERE id = 'fedc448b-0409-4c44-b40a-711c167c468b';