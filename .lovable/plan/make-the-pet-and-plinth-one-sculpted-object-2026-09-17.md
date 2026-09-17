# Make the pet and plinth one sculpted object

## Outcome
The generated pet bust will rise naturally from a compact rectangular plinth instead of appearing placed on a separate oversized box. The pet will be centered and moved slightly toward the visible front, while preserving a flat face for readable raised lettering.

## Changes
- Replace the sharp full-depth slab with a compact plinth made from a straight lettering band and a tapered upper shoulder.
- Size and center the plinth from the sculpture’s actual connection area, not the full generated model bounds.
- Sink the bust into the shoulder with a safe overlap so the final print is one fused object.
- Move the bust slightly toward the front and keep the base stable, comfortable to hold, and within the purchased size.
- Keep all current protections: remove invented round pedestals, never cut standing animals, add lettering once, and block unsupported lettering.

## Validation
- Add geometry tests for a continuous shoulder, centered/forward placement, compact footprint, no surviving round pedestal, and sold-size compliance.
- Run the complete engraving and print-file test set.
- Deploy every function that shares this geometry.
- Rebuild SUNNY through the admin-only inspection flow, verify the resulting STL measurements, and leave it awaiting approval so nothing reaches or charges the print partner.
