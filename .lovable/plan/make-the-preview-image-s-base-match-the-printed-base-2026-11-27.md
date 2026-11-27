# Make the preview image's base match the printed base

## Goal
The preview image shows the same base shoppers will receive. The shopper flow stays as it is now: no 3D views and no extra steps.

## What changes
1. The preview image instruction describes our real base instead of a "soft, filleted, flowing" one:
   - a low rectangular block with crisp, straight vertical sides and flat top edges
   - a short straight-sloped shoulder on top, slightly narrower than the block, that the pet's chest sits on
   - the name as bold raised capitals centred on the block's flat front face, which stays flat
   - same colour, no rounding, no pedestal, no separate slab
2. The same base description goes into every place that makes or redoes a render: new previews, revisions ("Re-render with this change") and the admin regenerate-render tool.
3. Check: make 3 to 4 previews with old photos (one with a name, one without, one with a long-eared dog). Compare each with that pet's real print file, then adjust the wording once if needed.

## Technical details
- Put the base wording in a single shared file, `supabase/functions/_shared/plinthPrompt.ts`, built from the real proportions in `steppedPlinth` / `reinforceTris` in `_shared/engraveStl.ts`: block height, shoulder height and inset, lettering cap height of 12 mm, relief of 0.8 mm.
- Replace the "broad tapered and softly filleted transition" sentence in `originals-preview/index.ts`, and use the same file in `admin-regenerate-render`.
- Add a small test that the base wording is used and that the word "filleted" never comes back.
- Add an AGENTS.md rule: the render's base description comes only from `_shared/plinthPrompt.ts`, and it must change whenever the printed base shape changes.
- Existing previews and orders are not touched.
