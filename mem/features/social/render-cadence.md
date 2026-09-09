---
name: Social scheduler render cadence
description: Render each Instagram creative only when its posting slot is due; one post daily at 16:00 UTC (12:00 ET); happy/calm expression mix, never sad
type: preference
---
Render one creative only when its scheduled posting slot is due. Never pre-render future slots or bulk-render the queue.

**Why:** keeps creatives current and limits paid AI use to the single actual daily post.

**How to apply:** invoke the scheduler once daily at 16:00 UTC (12:00 ET); `SLOT_HOURS_UTC = [16]` in `social-scheduler`, cron job `social-scheduler-daily` at `0 16 * * *`. Each invocation may render at most one due creative, run its engineering check, and publish one approved post. A 402/403 AI circuit pause must not prevent already-rendered approved posts from publishing. Every render still carries the single raised nameplate + 4:5 portrait clauses.

**Expression mix:** every render uses a deterministic happy-or-calm expression (`expressionFor(id)` in `social-scheduler`) — roughly half joyful open-mouthed smiles, half calm content faces. NEVER solemn, grieving, or sad.

**Single-filament colour:** every render (social + hero/product imagery) must show one uniform filament colour across the whole piece — eyes, pupils, nose, tongue, mouth and base identical matte colour to the body. Eyes read as carved form only (`MONOCHROME_CLAUSE` in `social-scheduler`).

**Lettering rule:** exactly one raised nameplate on the front face of the plinth; the plinth top surface is completely bare. Never recessed/sunken/engraved lettering, never a second text instance.
