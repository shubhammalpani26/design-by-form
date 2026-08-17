---
name: Social scheduler render cadence
description: Only render Instagram creatives 2 days ahead; keep cron/auto-publish always on
type: preference
---
Render creatives only for posts scheduled within the next 2 days (RENDER_LOOKAHEAD_MS = 2 days in `social-scheduler`). Never bulk-render the whole 7-day queue.

**Why:** keeps creatives in context and in sync with the current narrative; avoids stale/off-message posts and wasted AI credits.

**How to apply:** keep the 5-minute cron and auto-publishing enabled at all times; the queue stays seeded for 7 days but images generate rolling 2 days out. Every render still passes the engineering agent and carries the engraving + 4:5 portrait clauses.
