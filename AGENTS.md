# Project architecture

- Keep product-specific editorial comparisons in the product page and upload guidance beside the upload control, so merchandising does not alter preview generation or checkout behavior.
- On photo-based Originals pages, show upload before optional personalization controls; why: visitors can start with their photo without losing access to lettering and colour choices.
- Originals lettering goes only on the plinth's flat front wall and fails into manual review if off-centre, off the flat face, or too small; why: lopsided/faint lettering must never ship silently.
- A daily read-only watchdog flags paid Originals orders that miss schedule and emails one digest; why: partner failures must never be discovered by chance, and the watchdog must never act on orders itself.
- The Originals geometry gate (supabase/functions/_shared/meshCheck.ts) must flag thin features (wings, ears, tails, raised paws under ~1.4 mm) via surface sampling, not just mean wall thickness; why: Slant accepts the slice but fails thin features at QC and cancels the paid order days later (TAM order, Oct 2026).
- Originals previews screen each upload before rendering and reject photos with no pet or explicit content; why: the product is pets-only and an explicit upload reached a partner (TAM, Oct 2026). The screen fails open so outages never block shoppers; preview approval still gates production.
- When the Originals photo screen cannot run, the preview is stored as unscreened and any order from it is held for admin review (with email); why: fail-open must never let an unchecked photo reach the partner.
