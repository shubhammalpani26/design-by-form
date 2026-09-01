# Pre-Ad Validation Batch: 6 Test Pieces, One Shipment

Goal: prove — physically, not in simulation — that a buyer's photo becomes a printable, correctly engraved piece across the pet types, sizes and text edge cases the ads will attract. One partner shipment to the existing US address, so shipping is paid once.

## The matrix

Six pieces, chosen so each one kills a specific doubt:

| # | Piece | Pet / input | Size | Engraving | What it proves |
|---|---|---|---|---|---|
| 1 | Pet memorial (photo) | Cat, short hair (distinctive: Bengal / tabby) | Petite 120 mm | `MILO` + `2014 — 2024` | Smallest plinth still engraves legibly; a second cat form to match the unique-cat social posts |
| 2 | Pet memorial (photo) | Dog, short snout (pug/bulldog) | Standard 140 mm | `BARTHOLOMEW REX` (18 chars, wraps) | Long-name wrapping on a mid plinth |
| 3 | Pet memorial (photo) | Cat, long hair | Standard 140 mm | `ZOË` only, no footnote | Accent stripping + heading-only layout |
| 4 | Pet portrait (photo) | Dog, floppy ears (beagle/spaniel) | Statement 196 mm | `DUSKY` + `GOOD GIRL` | Largest size, the SKU that failed before, non-date footnote |
| 5 | Pet memorial (photo) | Rabbit (non-dog/cat form) | Petite 120 mm | `PIP` | Meshy handles an unusual silhouette; short text on small plinth |
| 6 | Pet memorial (photo) | Bird / parrot (beak + crest) | Statement 196 mm | `KIWI` + `FLY FREE` | Meshy sculpts a non-mammal head (beak, feathers, crest) at the largest size; verifies the generator generalises beyond dogs/cats |

All six placed as a single cart so they share one `group_id` and go to the partner as one shipment.

## How they're ordered

- **Piece 1** goes through the real customer checkout with a real card, start to finish: preview → size selection → feasibility → payment → confirmation email → model → engraving → fulfilment → tracking → review request. This is the one that validates money, webhooks and email.
- **Pieces 2–6** go through the same public flow using a single-use 100% promo code (created for this batch, capped redemptions, expires in 7 days). Same code path, no card charges; partner cost is still real.
- Before any of them is released to the partner, each generated STL is inspected: engraved text present, correct string, cap height, single closed solid, inside the 220 mm envelope.

## Verification gates

For each piece, recorded in a checklist artifact:

1. Preview render matches the uploaded pet (breed, ears, snout).
2. Feasibility verdict returned for the *selected* size, with a partner quote.
3. `originals_orders` row: status `paid`, correct `size_key`, correct `personalization`.
4. `engraved_text` matches the normalised heading/footnote, `engraved_at` set.
5. Downloaded STL visually rendered — lettering physically cut, readable at scale.
6. Fulfilment gate not tripped; `partner_order_id` set; single shipment for all six.
7. Tracking sync updates status; delivery triggers the review-request email.

Anything that trips the gate stops the batch and gets fixed before the remaining pieces are released — that is the point of running them together.

## After delivery

- Photograph the engraved plinths — that's the asset for the PDP plinth view and the ad creative promise.
- Record actual partner cost per size vs. retail, confirming margin at all three price points.
- Only then flip the ad set active.

## Technical notes

- A batch promo code row is added to `originals_promo_codes` (100% off, max redemptions 5, short expiry, deactivated after the batch).
- Ordering is done through the live storefront so no code path is bypassed; server-side calls are used only for inspection (`originals-fulfill` dry run before the real send, STL download, DB reads).
- The Originals Ops tab's new engraving success-rate card is the live readout during the batch — it should read 6/6 before the partner order is placed.
- No product code changes are planned; if a gate fails, the fix is scoped then and re-verified on that piece before continuing.
