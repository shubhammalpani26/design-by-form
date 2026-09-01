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
