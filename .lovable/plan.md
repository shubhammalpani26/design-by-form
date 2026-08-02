## Goal
Let shoppers choose the exact Slant 3D filament/color for each US-made product, store that choice on the order line, and fulfill with the selected color.

## Out of scope / confirmed limitation
True multi-color within a single printed object is not supported by the partner API (one line = one `order_item_color` + `profile`). Multi-color pieces would need separate parts assembled post-print; that is not part of this change.

## Plan

### 1. Data model: map finishes to partner filaments
- Evolve `designer_products.available_finishes` to support objects: `{ name, filament, hex? }` while keeping string entries backward-compatible.
- Add a helper to normalize finishes (string → object with `filament` defaulting to `product.slant3d_filament`).
- Backfill existing products: if `available_finishes` is an array of strings, treat each string as both display name and filament name, defaulting to `slant3d_filament`.

### 2. Fetch & cache partner filament catalog
- Add `getFilaments()` call from `slant3d.ts` to an edge function or admin-only RPC.
- Cache the catalog (filament name, hex color, profile) in a new `pricing_config` row or a short-lived Supabase cache table so the product page can render real color swatches without exposing the partner API directly to the browser.
- Refresh cache daily or on admin demand.

### 3. Product detail page color selector
- In `ProductDetail.tsx`, when `manufacturing_method === 'fdm_us'` and `available_finishes` has entries, render a filament/color swatch row.
- Show color name + hex swatch when the filament exists in the cached catalog; fallback to a generic chip if unknown.
- Selected finish is stored in component state and passed into `addToCart` as `customizations.finish` and `customizations.filament`.

### 4. Cart & checkout persistence
- `CartContext` / `cart` table already supports `customizations` jsonb.
- Ensure `addToCart` writes `{ finish: "Matte Black", filament: "PLA BLACK" }` into `customizations`.
- Ensure checkout/order creation copies `customizations` from cart to `order_items.customizations`.

### 5. Fulfillment uses selected filament
- Update `slant3d-fulfill/index.ts`: read `item.customizations?.filament` first, then fall back to `product.slant3d_filament`.
- Validate the filament string against the partner catalog before placing the order; if invalid, record `status: 'needs_file'` (or a new `invalid_color`) and surface the error.
- Log selected finish/filament in `slant3d_fulfillments.request_payload`.

### 6. Creator / admin UI
- In `ProductEdit.tsx` and the admin product edit, add a small "Finish → Filament" mapping panel when `manufacturing_method === 'fdm_us'`.
- Let creators pick from the cached partner filament catalog for each finish, or type a custom filament string.
- Save normalized `{ name, filament, hex? }` objects into `available_finishes`.

### 7. Quote behavior
- `slant3d-quote` continues to quote using the product's default `slant3d_filament` because partner pricing is largely material/profile-driven, not color-driven.
- If later we find large price deltas between filaments, we can extend quoting per variant; not needed now.

### 8. Testing
- Verify a non-US product does not show the selector.
- Verify selecting a finish updates cart customizations.
- Verify `slant3d-fulfill` uses the custom filament string and falls back correctly.
- Verify legacy string-only `available_finishes` still render and fulfill.

## Files expected to change
- `supabase/functions/slant3d-fulfill/index.ts`
- `src/pages/ProductDetail.tsx`
- `src/pages/ProductEdit.tsx`
- `src/contexts/CartContext.tsx`
- `src/pages/Cart.tsx` / `Checkout.tsx` (display selected finish)
- `src/components/admin/ProductsManagement.tsx` or `AdminProductEdit.tsx`
- New edge function or RPC to expose cached filament catalog
- Migration for `available_finishes` normalization (if needed beyond app-level handling)