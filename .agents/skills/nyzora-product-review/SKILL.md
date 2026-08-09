---
name: nyzora-product-review
description: Review submitted creator designs for approval, rejection, or manufacturing readiness. Triggers on "review design", "approve product", "reject product", "pending designs", "design constraints", or "check manufacturability".
---

# Nyzora Product Review

## Context

Creator designs live in `public.designer_products`. Status flow: `pending` → `approved` or `rejected`. Non-admin creators cannot self-approve; only admins can change status to `approved`.

## Business rules

- Creators keep 100% of markup (Selling Price − Manufacturing Base Price). Platform earns a flat 20% commission on MBP per unit, recorded on `order_items.commission_*`.
- MBP is opaque to creators and shoppers. Never expose how it is calculated.
- Approved products auto-publish to the community feed.
- Rejection reasons must be at least 10 characters and viewable on the creator dashboard.

## Manufacturing constraints

All 3D-printable designs must be:
- Solid, monolithic forms.
- Flat-based (no floating or unsupported bases).
- No lattice, perforations, or thin walls that fail FDM printing.
- For `fdm_us` (Slant 3D): within roughly a 250mm cube envelope.

## Review process

1. Load the pending product from `public.designer_products`.
2. Check the proposed `manufacturing_method` (`artisan_in` or `fdm_us`), `manufacturing_tiers`, `dimensions`, and `budget_tier`.
3. If the design is `fdm_us` and dimensions are missing or suspicious, run `supabase/functions/engineering-check` or `supabase/functions/slant3d-quote` to validate fit.
4. Verify the product has a valid image and, for 3D-printable pieces, a model file.
5. Decide:
   - **Approve** if constraints are met, pricing is set, and assets are present. Set `status = 'approved'`.
   - **Reject** if constraints fail, assets are missing, or pricing is broken. Set `status = 'rejected'` and write a clear `rejection_reason` (≥10 chars).
6. Surface the decision and rationale to the admin UI; do not silently change status.

## Editing listed products

If a creator edits an already-approved product, the status must revert to `pending` so the change goes back through admin review. This is handled in `src/pages/ProductEdit.tsx`.
