I found the logged-in header is still trying to fit too many desktop actions into a 1000px-wide preview: nav links, search, Create, credits, cart, notifications, currency, and profile. The current `overflow-x-hidden` masks the problem instead of solving it, so items look cramped/clipped and visually overlap.

Plan:

1. Simplify the logged-in header at tablet/small-desktop widths
   - Keep the brand logo, the key nav links, search icon, Create action, and a compact account/menu entry.
   - Move secondary logged-in controls into the account dropdown at constrained widths instead of showing all of them inline.
   - Specifically, hide the inline credits/currency/profile text on medium widths and expose them cleanly inside the dropdown or only at wider breakpoints.

2. Fix the header container behavior
   - Replace the rigid `container` spacing in the header with a full-width responsive wrapper using smaller side padding.
   - Remove/avoid `overflow-x-hidden` as a crutch so layout issues don’t get clipped silently.
   - Make the nav area shrink correctly and progressively hide lower-priority links before actions collide.

3. Make action buttons consistently compact
   - Ensure notification, cart, search, and user buttons use `h-8/w-8` or `h-9/w-9` consistently.
   - Keep credits as icon + number only until enough room is available.
   - Keep currency icon-only until larger screens; no wide currency pill on the 1000px preview.

4. Verify responsive states
   - Check logged-in header at the user’s current preview size around `1000x638`.
   - Check 1280px desktop.
   - Check mobile widths around 390px to ensure the hamburger/logo/actions remain clean.

Expected result: the logged-in header will stop overlapping and will look intentionally minimal at smaller desktop/tablet widths, rather than squeezing every account control into one row.