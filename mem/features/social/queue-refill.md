---
name: Social queue self-refill
description: social-scheduler tops up 3 days of feed slots each run by recycling the plan, so posting never stops when a plan runs out
type: feature
---
The original 10-day Instagram plan ran out on 2026-08-27 and posting silently stopped because nothing seeded new slots.

`social-scheduler` now calls `ensureQueue()` on every cron run: it keeps 3 days of the four daily UTC slots (00, 13, 16, 21) queued, cloning captions/prompts/themes from existing feed rows. Each new row gets a fresh id, so species, engraving and expression vary.
