-- Traction seed: 4 creators + 5 products + 5 sales
DO $$
DECLARE
  -- Auth user IDs (will be created)
  u_astha UUID := '11111111-aaaa-1111-1111-000000000001';
  u_posh  UUID := '11111111-aaaa-1111-1111-000000000002';
  u_preksha UUID := '11111111-aaaa-1111-1111-000000000003';
  u_raina UUID := '11111111-aaaa-1111-1111-000000000004';

  -- Designer profile IDs
  v_astha UUID := '11111111-1111-1111-1111-000000000001';
  v_posh  UUID := '11111111-1111-1111-1111-000000000002';
  v_preksha UUID := '11111111-1111-1111-1111-000000000003';
  v_raina UUID := '11111111-1111-1111-1111-000000000004';

  -- Product IDs
  p_astha_bench UUID    := '22222222-2222-2222-2222-000000000001';
  p_posh_table UUID     := '22222222-2222-2222-2222-000000000002';
  p_posh_lounger UUID   := '22222222-2222-2222-2222-000000000003';
  p_preksha_bench UUID  := '22222222-2222-2222-2222-000000000004';
  p_raina_sofa UUID     := '22222222-2222-2222-2222-000000000005';
BEGIN
  -- Create auth users (idempotent)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    (u_astha, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'astha@nyzora.ai', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Astha"}', now(), now(), '', '', '', ''),
    (u_posh, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'posh@nyzora.ai', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Posh Enterprise"}', now(), now(), '', '', '', ''),
    (u_preksha, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'preksha@nyzora.ai', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Preksha Jain"}', now(), now(), '', '', '', ''),
    (u_raina, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'raina@nyzora.ai', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Raina Jain"}', now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Creator profiles
  INSERT INTO public.designer_profiles (id, user_id, name, email, design_background, furniture_interests, status, terms_accepted, terms_accepted_at)
  VALUES
    (v_astha, u_astha, 'Astha', 'astha@nyzora.ai', 'Pattern-driven contemporary furniture creator with a focus on sculptural seating.', 'Accent benches, statement seating, patterned surfaces', 'approved', true, now()),
    (v_posh, u_posh, 'Posh Enterprise', 'posh@nyzora.ai', 'Contemporary studio crafting bold, colour-forward lounge and accent pieces.', 'Lounge seating, accent tables, statement decor', 'approved', true, now()),
    (v_preksha, u_preksha, 'Preksha Jain', 'preksha@nyzora.ai', 'Sculptural creator blending soft forms with tactile, textile-inspired surfaces.', 'Custom benches, modular seating, sculptural forms', 'approved', true, now()),
    (v_raina, u_raina, 'Raina Jain', 'raina@nyzora.ai', 'Crafts refined, design-forward sofas with an emphasis on silhouette and finish.', 'Designer sofas, lounge seating', 'approved', true, now())
  ON CONFLICT (id) DO NOTHING;

  -- Products
  INSERT INTO public.designer_products (id, designer_id, name, description, category, base_price, designer_price, original_designer_price, image_url, status, total_sales, weight, materials_description, lead_time_days)
  VALUES
    (p_astha_bench, v_astha, 'Patterned Wave Bench',
     'A sculptural accent bench wrapped in an intricate hand-styled pattern. Engineered as a solid, monolithic form with a flat base for stability.',
     'accent-furniture', 50099, 70000, 70000, '/traction/astha-custom-bench.png', 'approved', 1, 28, 'High-grade resin composite with hand-finished patterned surface.', 21),
    (p_posh_table, v_posh, 'Coral Bloom Side Table',
     'A sculptural side table with cascading petal-like forms. Solid monolithic build with a flat, weight-bearing base.',
     'accent-furniture', 35775, 45000, 45000, '/traction/posh-side-table.png', 'approved', 1, 14, 'High-grade resin composite, hand-finished matte surface.', 18),
    (p_posh_lounger, v_posh, 'Ribbon Lounger Chair',
     'A flowing lounger and matching ottoman in a single sculptural language. Solid form, optimised for comfort and presence.',
     'accent-furniture', 87467, 110000, 110000, '/traction/posh-lounger-chair.png', 'approved', 1, 32, 'High-grade resin composite with smooth lacquered finish.', 24),
    (p_preksha_bench, v_preksha, 'Sinuous Textile Bench',
     'A custom modular bench with continuous curved forms wrapped in a tactile blue textile-style finish. Solid monolithic construction.',
     'accent-furniture', 169741, 180000, 180000, '/traction/preksha-custom-bench.jpeg', 'approved', 1, 42, 'High-grade resin composite with woven-textile aesthetic surface.', 28),
    (p_raina_sofa, v_raina, 'Atelier Designer Sofa',
     'A refined four-seater designer sofa with sculpted backrests and tactile upholstery. Crafted by master woodworkers and upholstery artisans.',
     'sofas', 60000, 75000, 75000, '/traction/preksha-custom-bench-2.jpeg', 'approved', 1, 55, 'Solid hardwood frame, premium fabric upholstery, hand-finished.', 30)
  ON CONFLICT (id) DO NOTHING;

  -- Sales records
  INSERT INTO public.product_sales (product_id, designer_id, sale_price, base_price, designer_markup, commission_rate, commission_amount, designer_earnings, sale_date)
  VALUES
    (p_astha_bench, v_astha, 70000, 50099, 19901, 30, 5970.30, 13930.70, now() - interval '14 days'),
    (p_posh_table, v_posh, 45000, 35775, 9225, 30, 2767.50, 6457.50, now() - interval '21 days'),
    (p_posh_lounger, v_posh, 110000, 87467, 22533, 30, 6759.90, 15773.10, now() - interval '9 days'),
    (p_preksha_bench, v_preksha, 180000, 169741, 10259, 30, 3077.70, 7181.30, now() - interval '5 days'),
    (p_raina_sofa, v_raina, 75000, 60000, 15000, 30, 4500, 10500, now() - interval '17 days');
END $$;