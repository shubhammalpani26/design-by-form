---
name: Branded Packing Insert (US partner)
description: 4x6 B/W Nyzora card added to every US order; partner stationery id, image URL, and the PUT-not-PATCH update quirk
type: reference
---
Every US print-partner order includes a branded 4x6 black & white insert (type `STATIONERY` line item in `draftOrder`). If it fails, the order is retried without it — never block fulfillment.

- Active stationery id lives in secret `SLANT3D_STATIONERY_ID` (registered 2026-08-24 as "Nyzora Insert 4x6"). The older "Custom Card" record has no image and produces "Invalid Stationery Selection".
- Artwork: `product-images/brand/nyzora-insert-4x6.png` (public URL), wordmark + "Design Anything. We Make It Real." + "Made in the USA · Plant-based PLA" + nyzora.ai.
- Newly created stationery arrives `available: false` / `public: false` — it must be activated or the partner rejects it.
- Update endpoint is **PUT** `/stationery/{id}`; PATCH 404s.
