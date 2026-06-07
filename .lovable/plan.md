## Goal
Make the chat at `/studio` the entire workflow — from idea → image → manufacturable → listed → shareable product link — without ever leaving the page. Add cheaper Beni Enterprises products so the catalog isn't only premium Cyanique pieces, and teach the AI to propose both styles.

## Scope (all 4 in this loop)

### 1. Stop button in chat
- Wire an `AbortController` into `handleSend`, `handleApplyFinish`, `handleSeeInSpaceFile`, `handleGenerate3D`, and the new inline pricing/listing calls.
- While `busy === true`, the composer's send button becomes a Stop button (square icon) that calls `controller.abort()` and resets `busy`.
- On abort: update any pending assistant placeholder message to "Stopped." instead of leaving it spinning.

### 2. Full end-to-end listing inside the chat
Triggered by the existing "Make manufacturable & price" chip — but now it stays in chat instead of navigating to `/design-studio`.

Flow (each step is a new assistant message with an inline card):

1. **Creator registration** — if the user has no `designer_profiles` row:
   - Assistant asks for name + email (email pre-filled from auth).
   - On submit, insert a `designer_profiles` row with `status='approved'`, `terms_accepted=true` (same shortcut the personal-mode flow already uses). No redirect.

2. **Auto dimensions & weight** — assistant invokes `calculate-weight` + a new lightweight dimension-estimator (or reuses Gemini via `recalculate-pricing` with sensible defaults). Renders an editable card: `Width × Depth × Height (cm)` + estimated weight + category, all pre-filled. User clicks **Confirm & price**.

3. **Pricing** — calls existing `recalculate-pricing` edge function. Shows MBP (private), suggested selling price, and an editable selling price slider (creator keeps 100% of markup, per existing monetization rule).

4. **Title + description** — auto-generated in background via `generate-product-title` + `generate-product-description`. Editable inline.

5. **Publish** — inserts into `designer_products` (status `approved` for personal mode, or `pending` for designer mode — keep current behavior; for demo, default to `approved` so the link works immediately). Inserts `design_listings` row with `listing_fee_paid: true` (waived). Posts the final assistant message:
   > ✓ Listed. View live product → `/product/<slug>`  
   > Copy link · Share · Open dashboard

All steps reuse existing edge functions; no new backend infra required besides one tiny `register-creator-inline` helper (or just direct insert from client — RLS allows the user to create their own profile, and we'll keep the insert client-side).

### 3. Beni Enterprises cheaper catalog
Seed ~8 products into `designer_products` priced ₹3,500 – ₹18,000 across the categories Beni covers (dining table, console, coffee table, bench, shelving, chair, side table, sideboard). All `status='approved'`, attributed to a new "Beni Studio" creator profile (or reuse an existing seeded profile if present). Use existing curated stock-style images or generate via `generate-design` with traditional-wood prompts.

These will show on `/browse` immediately and route to Beni Enterprise as the maker (already wired in `src/data/makers.ts`).

### 4. Broaden AI prompts (Cyanique + Beni)
In `supabase/functions/generate-design/index.ts` and the `STARTER_PROMPTS` / surprise-me lists:
- Tell the model the platform makes BOTH sculptural additive pieces (Cyanique) AND traditional solid wood / craft furniture (Beni Enterprises).
- Allow rectilinear, slatted, joinery-based silhouettes for `Table`, `Console`, `Shelving`, `Bed`, `Chair` when the user's prompt implies traditional/wood/craft.
- Adjust the "solid monolithic flat-base" hard constraint so it only applies to additive/resin categories (decor, sculptures, accent pieces) — wood furniture can have legs, slats, and joinery.
- Add Beni-style starter prompts: e.g. "A walnut slatted bench with brass inlays", "A teak 4-drawer console with tapered legs", "A solid oak dining table with breadboard ends".

## Technical notes
- New file: `src/components/studio/InlineListingFlow.tsx` (registration card, dim/price card, publish card, success card). Rendered as special `MessageBubble` kinds (`creator-register`, `confirm-dims`, `confirm-price`, `listing-published`).
- Reuse: `calculate-weight`, `recalculate-pricing`, `generate-product-description`, `generate-product-title`. No new edge functions.
- Beni seeding: one `supabase--insert` call.
- Abort: stored in a `useRef<AbortController | null>`; passed to `supabase.functions.invoke` via `{ signal: controller.signal }` where supported, otherwise we just stop processing the result and mark `busy = false`.
- `handleMakeManufacturable` no longer navigates — it inserts a `creator-register` assistant message (or skips straight to `confirm-dims` if profile exists).
- Slug for the success link comes from the existing `set_slug_on_product` trigger.

## Out of scope (defer)
- 3D model generation paywall (regular ₹750) — keep existing flow; the demo path uses 2D image listing.
- Stripe / Razorpay payment for listing fee — keep "waived" per existing messaging memory.
- Multi-step creator approval review — demo auto-approves.
