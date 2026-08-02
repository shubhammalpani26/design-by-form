# Plan: US Creator Payouts + Personalization at Checkout

## 1. US Creator Payouts

### Goal
Let US-based creators accumulate USD earnings from `fdm_us` sales and request ACH payouts to a US bank account.

### Database changes
- Add `bank_routing_number` to `public.designer_bank_details` (encrypted at application level or stored as text; decision below).
- Add `currency` and `country` columns to `public.designer_earnings` so US sales accrue in USD.
- Add `payout_currency` to `public.payout_requests`.

### Order routing
- Update `shopify-order-webhook` / `create-order` so `fdm_us` line items record `designer_earnings` in USD using the current USD sale price.

### Bank details UI
- Extend `/designer-bank-details` to show a country toggle (India / US / International).
  - India: IFSC + account number.
  - US: routing number + account number.
  - International: SWIFT + IBAN.

### Payout request UI
- Creator dashboard shows separate INR and USD balances.
- Minimum thresholds: ₹5,000 INR / $100 USD.
- Request creates a `payout_requests` row with `payout_currency = 'USD'`.

### Admin + payout rail
- Admin `/admin/payouts` filters by currency and marks USD requests approved/paid.
- For the actual money movement we have two options:
  - **Option A — Stripe Connect / Transfer**: Use existing Stripe integration to pay US creators via ACH. Requires collecting bank details through Stripe Connect onboarding.
  - **Option B — Manual ACH**: Admin records the bank transfer manually in the dashboard after paying out-of-band (Wise, wire, etc.).

### Recommendation
Start with **Option B** (manual ACH recording) so payouts can begin immediately while we keep Stripe Connect as a fast-follow for automation. This avoids blocking US launch on a Connect integration.

## 2. Personalization at Checkout

### Goal
Let buyers customize the product before purchase, increasing conversion and AOV.

### V1 personalizations (FDM_US friendly)
- **Filament color** — already shipped; keep as-is.
- **Engraved text** — optional text field (e.g., initials on the base). Stored in `order_items.customizations`.
- **Gift note** — free text, printed on packing slip; stored in `order_items.customizations`.

### UI changes
- `ProductDetail.tsx`: add an "Add personalization" section when `manufacturing_method = 'fdm_us'`.
  - Engraved text input with live preview placeholder.
  - Gift note textarea.
- `Cart.tsx` / checkout: display personalization summary per item.

### Backend changes
- `create-order` / `shopify-order-webhook`: pass `customizations` through to `order_items.customizations`.
- `slant3d-fulfill`: include `engraved_text` and `gift_note` in the partner order payload (in `order_item_name` or a note field).

### Pricing
- V1 personalization is free; later we can add a flat fee for engraving.

## 3. Verification
- Place a test `fdm_us` order with engraving and gift note; confirm `order_items.customizations` is populated and fulfillment payload includes the text.
- Create a USD payout request as a US creator; confirm admin dashboard shows it under USD filter.

---

Which option for the payout rail do you want — **Option A (Stripe Connect automation)** or **Option B (manual ACH recording to start)**? And should personalization v1 include **engraved text + gift note**, or do you want a different first personalization (e.g., custom dimensions)?