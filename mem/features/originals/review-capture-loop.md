---
name: Originals review capture loop
description: Post-delivery review request email + buyer photo strip on product pages; no fake reviews or stock social proof
type: feature
---

- `originals-tracking-sync` sends `originals-review-request` once per order when the partner reports `delivered`, stamping `originals_orders.review_requested_at` so it never repeats. `OPEN` statuses include `shipped` so delivery is actually detected.
- Email links to `/reviews?order=<id>` and asks for a photo/short video.
- `BuyerPhotoStrip` (product pages) shows approved `brand_reviews` media only — renders nothing until real customer photos exist. Never seed placeholder/stock reviews.
