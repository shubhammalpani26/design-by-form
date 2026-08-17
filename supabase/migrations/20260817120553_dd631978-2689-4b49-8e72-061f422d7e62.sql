UPDATE public.social_scheduled_posts SET
  slot_type = 'feed',
  theme = 'Editorial',
  image_prompt = replace(replace(image_prompt, 'Vertical 9:16', 'Editorial 4:5 portrait'), 'vertical 9:16', 'editorial 4:5 portrait'),
  image_url = NULL,
  status = 'scheduled',
  attempts = 0,
  engineering_status = 'pending',
  engineering = NULL,
  last_error = NULL,
  caption = CASE day_index
    WHEN 1 THEN E'One photo. One piece.\n\nWe model your dog from a single photo and make it in high-grade resin. Made in the US, delivered in about 7 days.\n\nStart at nyzora.ai\n\n#petmemorial #petkeepsake #dogmemorial #custompetgift #petportrait #memorialgift #petloss #dogmom'
    WHEN 2 THEN E'From snapshot to sculpture.\n\nThe photo you already have is enough. We handle the rest.\n\nnyzora.ai\n\n#custompetportrait #petkeepsake #dogportrait #petmemorial #personalizedgift #petgift #dogdad'
    WHEN 3 THEN E'Their name, cut into the base.\n\nEngraved, not printed. Matte charcoal resin. 2-year warranty.\n\nnyzora.ai\n\n#petmemorial #engraved #dogmemorial #keepsake #memorialgift #petloss #custompetgift'
    WHEN 4 THEN E'Six finishes. One piece that is yours.\n\nBone white, charcoal, marble, slate, sand, blush.\n\nnyzora.ai\n\n#petkeepsake #custompetgift #petportrait #homedecor #petmemorial #giftideas #dogmom'
    WHEN 5 THEN E'Small enough for a shelf. Heavy enough to matter.\n\nMade in the US. Ships in about 7 days.\n\nnyzora.ai\n\n#petportrait #custompetgift #dogmom #shelfdecor #petkeepsake #madeintheusa #giftideas'
    WHEN 6 THEN E'Arrives ready to give.\n\nUnbranded box, protected in transit, delivered in about 7 days.\n\nnyzora.ai\n\n#giftideas #custompetgift #petkeepsake #petmemorial #thoughtfulgifts #dogdad #memorialgift'
    ELSE E'Design anything. We make it real.\n\nOne photo is where it starts. nyzora.ai\n\n#custompetgift #petmemorial #petkeepsake #dogportrait #madeintheusa #personalizedgift #giftideas'
  END
WHERE slot_type = 'story';