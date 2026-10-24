# Project architecture

- Keep product-specific editorial comparisons in the product page and upload guidance beside the upload control, so merchandising does not alter preview generation or checkout behavior.
- On photo-based Originals pages, show upload before optional personalization controls; why: visitors can start with their photo without losing access to lettering and colour choices.
- Originals lettering goes only on the plinth's flat front wall and fails into manual review if off-centre, off the flat face, or too small; why: lopsided/faint lettering must never ship silently.
- A daily read-only watchdog flags paid Originals orders that miss schedule and emails one digest; why: partner failures must never be discovered by chance, and the watchdog must never act on orders itself.
- The Originals geometry gate (supabase/functions/_shared/meshCheck.ts) must flag thin features (wings, ears, tails, raised paws under ~1.4 mm) via surface sampling, not just mean wall thickness; why: Slant accepts the slice but fails thin features at QC and cancels the paid order days later (TAM order, Oct 2026).
- Exterior-surface checks must use spatially indexed signed ray crossings, not a full-mesh winding calculation per sample; why: overlapping internal shells must be excluded without exhausting the order-check worker's CPU budget.
- Mesh repair retries apply only to repairable topology blockers and reuse their measured report; why: welding cannot fix thin material and repeated analysis can exhaust CPU before returning a safe rejection.
- Originals previews screen each upload before rendering and reject photos with no pet or explicit content; why: the product is pets-only and an explicit upload reached a partner (TAM, Oct 2026). The screen fails open so outages never block shoppers; preview approval still gates production.
- When the Originals photo screen cannot run, the preview is stored as unscreened and any order from it is held for admin review (with email); why: fail-open must never let an unchecked photo reach the partner.
- Meta Conversions API events reuse the pixel event_id (Purchase = first order row id, sent once from markOriginalsPaid; InitiateCheckout via meta-capi relay) and are sent only when the browser had tracking consent at checkout; why: Meta dedupes browser+server copies and no-consent visitors must never be reported.
- Admin dashboard Meta ad reads go through the linked Meta Ads connector gateway, not stored Graph API tokens; why: pasted Meta tokens expire after ~60 days and silently broke the dashboard (Oct 2026).
