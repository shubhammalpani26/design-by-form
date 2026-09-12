# Put the name on the visible front of the plinth

## Fix
- Correct the 3D conversion so standard Y-up models are rotated upright before any print file is created.
- Normalize older cached print files before lettering, so they cannot carry the old underside-placement mistake into a new order.
- Place lettering on the known visible front face of the plinth, not whichever flat surface happens to be largest.
- Record a new placement-verification version and exact lettering bounds with each order.
- Block fulfilment unless the lettering is verified on a vertical front face above the physical base.

## Proof before another order
- Add regression tests for both Y-up and Z-up models.
- Run the six delivered source files through the corrected pipeline and render the final front views.
- Confirm each name/date is visible on the front plinth before deploying the model and fulfilment functions.

## Technical details
- Rotate Meshy/glTF coordinates from `(x, y, z)` to STL coordinates `(x, -z, y)` at conversion.
- Detect and normalize legacy Y-up STL files before engraving.
- Bias the engraver to the normalized `-Y` front face and fail rather than silently choose an underside or horizontal face.
- Treat legacy engraving records without the new placement proof as unverified, so they cannot be sent automatically.
