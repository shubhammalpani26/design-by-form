---
name: Originals engraving guarantee
description: Names/dates are cut into the STL as real geometry by engraveStl before fulfillment; unengraved personalised pieces are blocked from the print partner
type: feature
---

Root cause of blank plinths (orders Roxy, Dusky): lettering existed only in the Gemini render; the Meshy image-to-3D step smoothed it off, and printability validation never checked for text.

Fix (live):
- `supabase/functions/_shared/strokeFont.ts` — uppercase stroke font (A-Z, 0-9, punctuation).
- `supabase/functions/_shared/engraveStl.ts` — `engraveStl()` picks the flattest vertical face of the plinth (bottom 30% of the mesh), extrudes strokes as prisms: 1.2 mm proud, 0.6 mm embedded, 1.3 mm stroke width, cap height 5-12 mm. Also exports `engravingLabel(personalization)`.
- `originals-model` engraves every personalised piece after the mesh is prepared, stores `<id>-engraved.stl`, and writes `engraved_text` / `engraved_at` / `engraving_meta` on `originals_orders`. Engraving failure is fatal for the piece (alert + `needs_file`), never a silent ship.
- `originals-fulfill` hard-gates: if `engravingLabel(personalization)` is non-empty and `engraved_text` does not match, the order is not sent to the partner.

Raised (not recessed) lettering is deliberate — additive prisms need no boolean solver and read better on a 0.4 mm nozzle.

## Small-plinth sizing (2026 update)
- Stroke width scales with cap height (0.2x cap, clamped 0.9–1.6 mm) instead of a fixed 1.3 mm.
- Readable floor lowered to 3.5 mm cap; long headings wrap onto two lines at the best word break.
- Result: plinths from ~55 mm wide engrave successfully (was ~90 mm). Below that the fulfillment gate still blocks the order for admin review.
- Supported glyphs: A-Z 0-9 and `.,'&-/!:+` — admin dashboard normalisation mirrors this exactly, including accent stripping.
