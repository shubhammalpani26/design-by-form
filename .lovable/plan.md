# Pet Piece: US Pricing & Size Ladder

## The call

Sell the Pet Silhouette Piece as a **three-size ladder — $59 / $89 / $139**, free US shipping baked in, with the $89 "Standard" as the hero and a $119 compare-at. Do not sell the current 196 mm model as the default.

## Why

**What the US market charges** (all with free US shipping):

| Competitor | Price | Format |
|---|---|---|
| MyPetIn3D | from $42.99 | 3D-printed sculpture from photo |
| PrinYou | $69 (compare-at $109) | figurine, ships from China |
| Figuro | ~$73 | figurine from photo |
| Minglewood | $100-178 | marble, breed silhouette + name + dates |

Two things matter here. The $42-73 band is the *figurine* market — offshore, commodity, price-led. The $100-178 band is the *memorial* market — silhouette plus engraved name and date, which is exactly what your piece is. Industry data puts personalized gifts + home decor AOV at $100-200 with a 3.5-4% conversion rate, versus $0-100 AOV and 2.0-2.5% conversion for generic personalized gifts. The higher-priced memorial framing converts better, not worse.

**Your real cost forces the size decision.** At the current 196 x 171 x 62 mm (841 cm³) the piece costs $37 to print plus ~$6.50 to ship — $43.50 landed. That is a memorial-tier cost on a piece you were listing at $68, i.e. a loss. Print cost is volume-driven, so shrinking the model is the single highest-leverage move: 150 mm tall is 45% of the volume, 115 mm is 20%.

## The ladder

| Size | Height | Est. landed cost | Price | After Stripe fees | Margin |
|---|---|---|---|---|---|
| Petite | ~115 mm | ~$16.40 | **$59** | ~$40.60 | 69% |
| Standard (hero) | ~150 mm | ~$24.70 | **$89** | ~$61.40 | 69% |
| Statement | 196 mm (current) | ~$43.50 | **$139** | ~$91.20 | 66% |

Landed cost modelled as a ~$3 fixed handling charge plus ~$0.040/cm³, back-solved from your $37 quote, plus $6.50 shipping. Stripe assumed at 2.9% + $0.30.

$59 owns the price-comparison search and lets a hesitant buyer in. $89 is where most orders should land and is the number the homepage leads with. $139 exists mainly to make $89 look like the sensible choice.

## What this changes about margin policy

The `US_PARTNER_MARKUP = 2.0` rule would put the Statement size's MBP at $87 and force a $100+ floor on a piece the market caps near $139. That rule stays exactly as it is for **creator listings**, where MBP has to be derived from a live quote. **Nyzora Originals SKUs get fixed retail prices** set against the market ceiling instead — the 2x rule becomes a floor check, not the price.

At ~$60 contribution per Standard order, a $50/day Meta test can absorb a CAC up to ~$30 and still be profitable, which is what makes the ad plan viable.

## Implementation

1. **`src/data/originalsSkus.ts`** — extend `OriginalSku` with a `sizes` array (`{ id, label, heightMm, price, compareAt? }`) and a `basePrice` derived from the default size. Pet piece gets the three sizes above; Baby and Wedding keep single pricing until you get their quotes.
2. **`src/pages/OriginalDetail.tsx`** — size selector above the personalization fields, price updates live, compare-at strike-through on Standard, explicit "Free US shipping, made in the USA, ships in about 7 days" line under the price.
3. **`src/pages/OriginalsHome.tsx`** — show "from $59" on the pet card rather than a single price.
4. **Checkout / `create-checkout`** — pass the selected size id through to line items so fulfilment picks the right scaled STL.
5. **Model scaling** — generate the 115 mm and 150 mm scaled STLs from the existing engraved model. Engraved text depth stays at 1 mm absolute (not scaled) so the name stays legible on the Petite.

## Verify before launch

Slice the 150 mm and 115 mm STLs on the partner site and confirm the modelled costs. If the fixed-handling component is larger than assumed, the Petite is the size that breaks first — in that case drop it and launch with $89 / $139 only.
