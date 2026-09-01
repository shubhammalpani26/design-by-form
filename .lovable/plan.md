# Internal test promo code for pre-ad order testing

## Goal
Let you place the 6-piece edge-case test batch (and any future internal tests) through the **real checkout** at essentially no cost, instead of server-side fake orders — no credit burn, no meaningful card charges.

## What already exists (verified)
- `razorpay-checkout` validates and applies promo codes **server-side** via `_shared/originalsPromo.ts` — the browser never sets the price.
- Discount is spread across line items and stored on each order (`promo_code`, `discount_usd`).
- Redemption is counted only **after payment succeeds** (via `originalsPaid`).
- Guardrail: a discount can never reduce the order below **$1.00** (gateways can't charge $0), so a 100% code still charges $1 per checkout.

## Changes

### 1. Create the code (database insert, no migration needed)
Insert into `originals_promo_codes`:
- code: `NYZORA-QA` (internal, unguessable enough; not shown anywhere public)
- percent_off: `100`
- min_subtotal_usd: `0`
- active: `true`
- max_redemptions: `25` (plenty for the 6-piece batch + retests; auto-expires after that)
- description: "Internal QA testing — do not share"

Effect at checkout: each piece charges **$1.00 total** on your live card (6 pieces = $6 across checkouts, or ~$1 per order if checked out together as one session).

### 2. Safety checks before handing it over
- Confirm the code is rejected for expired/over-limit states (already enforced in `resolvePromo`).
- Confirm it works in the live Razorpay checkout path end-to-end with a real $1 charge going to `paid` status and triggering the model-generation pipeline (that's exactly what we want to test).

### 3. Hand-off
- Give you the code `NYZORA-QA` to use in the promo field at checkout.
- You run the 6-piece batch yourself through the real flow (preview → size → checkout with code).
- After testing, I deactivate the code (`active = false`) so it can't leak into customer hands.

## Notes / caveats
- **$1 floor is unavoidable** — a truly free order can't be created through the payment gateway. $1/order is the closest to free while still exercising the full real pipeline (payment → webhook → model gen → engraving → fulfillment gate).
- Preview generation still uses your account's AI credits (4 free/day for anonymous, credits when logged in). The promo only zeroes the product price.
- Fulfillment to Slant 3D still only happens on **paid** orders with a shipping address — these test orders will flow through like real ones, so only ship the ones you actually want manufactured.

## Technical details
- Table: `public.originals_promo_codes` (insert via SQL, service role)
- Validation: `supabase/functions/_shared/originalsPromo.ts` (`resolvePromo`)
- Checkout: `supabase/functions/razorpay-checkout/index.ts` (lines ~162–260)
- Redemption: `supabase/functions/_shared/originalsPaid.ts`
