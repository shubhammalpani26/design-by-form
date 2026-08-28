---
name: Photo piece print file rule
description: Photo-personalized SKUs must never be manufactured from the SKU master reference STL; fulfillment hard-blocks it
type: constraint
---
`originals_print_models` STLs are **pricing/reference only** for photo SKUs
(`pet-silhouette-keepsake`, `pet-portrait-sculpture`). Manufacturing one ships a
generic bust with no engraving — this happened on order `1857aa00` (Roxy).

`originals-fulfill` now refuses to send a photo piece to the partner when the
attached file is a master model (unless an operator passes an explicit per-row
`files` override), marking it `needs_file` and alerting ops.

**Why:** the buyer's own Meshy-sculpted + engraved STL is the only acceptable
production file for a personalized piece.
