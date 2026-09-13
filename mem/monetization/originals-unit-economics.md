---
name: Originals unit economics (real numbers)
description: Real landed partner cost vs retail for pet keepsake sizes, $/gram cost slope, and true gross margin — MBP is already 2x partner cost
type: feature
---

Gross profit on Originals is higher than a naive "3.5x" reading suggests, because MBP is already 2× partner landed cost and retail sits above that again.

Live partner slice data (pet-silhouette-keepsake, Sep 2026, from `originals_quotes`):

| Size | Print | Ship | Landed | Retail | Gross $ | Gross % |
|---|---|---|---|---|---|---|
| Petite (110 g) | $12.59 | $6.58 | $19.17 | $59–70 | $40–51 | 68–73% |
| Standard (180 g) | $17.26 | $7.60 | $24.86 | $89–90 | $64–65 | 72% |
| Statement (340 g) | $27.59 | $8.07 | $35.66 | $139 | $103 | 74% |

**Displayed weights updated Sep 13:** with the reinforced +40% solid base, customer-facing approx. weights are now busts 155/250/475 g (petite/standard/statement) and plaques 160 g. Recalibrate against the first weighed reinforced piece.

**Cost slope:** print cost ≈ $5.4 + $0.065 per finished gram (~$65/kg effective). Use this to price any geometry/weight change.

**Layering:** MBP = partner landed × 2.0 (`US_PARTNER_MARKUP`). Retail floor = landed × 3.5 (`RETAIL_MULTIPLE`), floored by PRICE_BOOK. So retail ≈ 1.75× MBP; gross margin over true landed cost is 68–74%, not ~50%.

Heavier pieces: every +10 g adds ~$0.65 landed (~0.7% margin at Standard). Making a piece 40% heavier (+70 g at Standard) costs ~$4.55 → margin 72% → ~67%.

**Production specification (Sep 2026):** photo-to-piece STLs receive a reinforced solid plinth/lower core before printability validation and partner quoting. The geometry targets roughly +40% volume where the build envelope allows, with a 16–24 mm base height. This both increases perceived heft and guarantees a taller visible front face for raised personalization. Real partner slices remain the authority for final weight and cost; do not replace them with a fixed estimate.
