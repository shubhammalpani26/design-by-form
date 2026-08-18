---
name: Social scheduler render cadence
description: Only render Instagram creatives 2 days ahead; keep cron/auto-publish always on; happy/calm expression mix, never sad
type: preference
---
Render creatives only for posts scheduled within the next 2 days (RENDER_LOOKAHEAD_MS = 2 days in `social-scheduler`). Never bulk-render the whole 7-day queue.

**Why:** keeps creatives in context and in sync with the current narrative; avoids stale/off-message posts and wasted AI credits.

**How to apply:** keep the 5-minute cron and auto-publishing enabled at all times; the queue stays seeded for 7 days but images generate rolling 2 days out. Every render still passes the engineering agent and carries the engraving + 4:5 portrait clauses.

**Expression mix:** every render uses a deterministic happy-or-calm expression (`expressionFor(id)` in `social-scheduler`) — roughly half joyful open-mouthed smiles, half calm content faces. NEVER solemn, grieving, or sad. Do not force every render to be happy.

**Single-filament colour:** every render (social + hero/product imagery) must show one uniform filament colour across the whole piece — eyes, pupils, nose, tongue, mouth and base identical matte colour to the body. No coloured irises, glossy wet highlights, pink tongues, or painted/two-tone details; eyes read as carved form only (`MONOCHROME_CLAUSE` in `social-scheduler`). The pieces are printed in a single filament, so multi-colour renders misrepresent the product.
