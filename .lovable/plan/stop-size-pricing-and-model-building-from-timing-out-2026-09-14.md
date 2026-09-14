# Stop size pricing and model building from timing out

## What's happening

Sometimes a shopper picks a size and gets no price, or a paid piece gets no model, and has to retry. The work behind those two steps talks to the print partner one call at a time, waits on the 3D generator, and re-tries slow calls up to three times. When the whole chain runs too long the job is cut off mid-way with no answer.

This is confirmed in the code but the fix touches the money path (live quoting, retail price, order fulfilment), so it should be approved before I change anything.

## Plan

1. **Give every partner call a shared time budget.** The retry helper gets a deadline passed down from the caller. Once the budget is spent, no further retry starts — the call fails fast instead of the whole job being killed.
2. **Do the size quotes side by side.** When more than one size is priced, run those partner slices concurrently (bounded to a small number at a time) instead of one after the other.
3. **Answer with the fallback price instead of nothing.** If the partner cannot answer inside the budget, return the published list price for that size, marked as an estimate, and log it for review — the shopper always sees a price.
4. **Stop the model step from looping too long.** The 3D generation check returns "still working" quickly and lets the next scheduled pass continue, rather than waiting inside one run.
5. **Verify.** Run the existing geometry and shared test suites, then exercise a size change and a photo-to-piece preview in the running app and confirm a price always appears.

## Technical notes

- `_shared/slant3d.ts`: `withPartnerRetry(fn, attempts)` gains an optional deadline (`AbortSignal`-free, simple `Date.now()` check); callers pass a budget derived from the request start time.
- `originals-feasibility/index.ts`: `priceSizes` loops sizes serially — switch to `Promise.all` over a chunked list; on failure fall back to `PRICE_BOOK` list price with `marginOk` left conservative and an entry written via `logValidation`.
- `originals-model/index.ts`: keep `pollModelTask` to a single poll per invocation (already close to this) and ensure the sweep path caps pieces per run.
- No schema changes; no client changes.
