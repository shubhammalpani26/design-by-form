# Smaller Pet Piece Sizes for Partner Quoting

Goal: get real landed cost at multiple sizes so we can lock a competitive US price ($69 small / $89 standard ladder).

## What gets produced
Scaled variants of the already-engraved pet piece (`nyzora-pet-keepsake-engraved.stl`, currently 196 mm tall):

| Variant | Longest edge | Purpose |
|---|---|---|
| Small | 120 mm | Owns the $69 search price |
| Medium | 140 mm | Middle option |
| Standard | 196 mm | Existing hero size (already exported) |

Each exported as both `.stl` and `.obj` into the documents folder, named `nyzora-pet-piece-120mm`, `-140mm`.

## How
- Uniform scale of the existing engraved mesh (engraving depth scales with it; at 120 mm the 1 mm recess becomes ~0.6 mm, still above FDM resolution with a 0.2 mm layer).
- Decimate the mesh before export so files stay well under partner upload limits — the current engraved STL is 57 MB, which is slow to quote.
- Report volume (cm³) and bounding box for each so the cost delta is visible before quoting.
- Verify each output is watertight and sits on Z=0.

## Notes
- No app code changes. These are downloadable files only.
- Once you run the three through the partner quote page, the price ladder gets written into the SKU data.
