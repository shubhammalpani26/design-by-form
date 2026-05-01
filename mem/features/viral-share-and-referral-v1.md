---
name: Viral share & referral system v1
description: Editorial poster share card + creator referral program (activation-only 30-credit reward)
type: feature
---
**Viral share loop**
- `ShareCardDialog` renders an editorial 1080x1350 poster on canvas (warm off-white bg, product image in white frame, big editorial title, "Designed by ..." attribution, NYZORA wordmark + nyzora.ai CTA).
- Download PNG, copy link, WhatsApp/X/Facebook, native share (image+url on supported devices).
- Mounted on ProductDetail; if viewer === creator, copy switches to "Share your design".
- All share URLs carry `?ref=<creator_slug>` via `buildReferralUrl`.

**Referral program (activation-only, 0 + 30)**
- Table: `referrals` (referrer_designer_id, referred_user_id UNIQUE, status pending|activated, credits_awarded).
- Capture: `useReferralCapture` hook on App root reads `?ref=` from any URL and stores slug in localStorage for 60d.
- Attribution: `attachReferralIfPending()` runs on SIGNED_IN in Auth.tsx — resolves slug → designer_profiles.id → inserts referrals row.
- Reward: DB trigger `award_referral_on_first_approval` fires on designer_products status→approved (only if it's that designer's FIRST approved product). Adds 30 credits to referrer's user_credits, logs credit_transactions row (type='referral_activation'), notifies referrer, marks referral activated.
- UI: `ReferralWidget` on Creator Dashboard shows invites/activated/credits earned + copyable link + share button.

**Files**
- src/hooks/useReferralCapture.ts
- src/lib/referrals.ts
- src/components/ShareCardDialog.tsx
- src/components/ReferralWidget.tsx
- (edits) src/App.tsx, src/pages/Auth.tsx, src/pages/ProductDetail.tsx, src/pages/CreatorDashboard.tsx
