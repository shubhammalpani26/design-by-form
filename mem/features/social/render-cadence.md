---
name: Social scheduler render cadence
description: Render each Instagram creative only when its posting slot is due; four posts daily; happy/calm expression mix, never sad
type: preference
---
Render one creative only when its scheduled posting slot is due. Never pre-render future slots or bulk-render the queue.

**Why:** keeps creatives current and limits paid AI use to the four actual daily posts.

**How to apply:** invoke the scheduler exactly four times daily at the four posting slots. Each invocation may render at most one due creative, run its engineering check, and publish one approved post. A 402/403 AI circuit pause must not prevent already-rendered approved posts from publishing. Every render still carries the engraving + 4:5 portrait clauses.

**Expression mix:** every render uses a deterministic happy-or-calm expression (`expressionFor(id)` in `social-scheduler`) — roughly half joyful open-mouthed smiles, half calm content faces. NEVER solemn, grieving, or sad. Do not force every render to be happy.

**Single-filament colour:** every render (social + hero/product imagery) must show one uniform filament colour across the whole piece — eyes, pupils, nose, tongue, mouth and base identical matte colour to the body. No coloured irises, glossy wet highlights, pink tongues, or painted/two-tone details; eyes read as carved form only (`MONOCHROME_CLAUSE` in `social-scheduler`). The pieces are printed in a single filament, so multi-colour renders misrepresent the product.
