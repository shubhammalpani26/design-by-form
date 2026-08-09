---
name: instagram-opportunity-scout
description: Triages an Instagram or social link Shubham pastes — identifies whether it is a funding, accelerator, grant, competition, partnership, creator-recruit or press opportunity, extracts deadline and requirements, qualifies it, and prepares the response on his behalf.
---

# Instagram Opportunity Scout

Trigger: Shubham pastes an Instagram (or LinkedIn/X) link, often with no explanation, or says "check this / handle this / is this worth it".

## Step 1 — Read the source

Fetch the post and the account. Instagram often blocks plain fetches; if so, load the public post URL with Playwright and read the caption and account bio. Never guess the contents from the URL slug.

Extract verbatim: what is offered, eligibility, deadline, application link, amount or benefit, and the account behind it.

## Step 2 — Classify

| Type | Signals | Hand off to |
| --- | --- | --- |
| Funding / VC | fund, cheque size, applications open, portfolio | `fundraiser` |
| Accelerator / incubator | cohort, batch, demo day, equity-free | `fundraiser` |
| Grant / competition | prize, no equity, submission deadline | `fundraiser` |
| Partnership / brand collab | collab, co-create, wholesale, retail | `business-strategist` |
| Creator recruit | a designer worth onboarding to Nyzora | `creator-economy-expert` |
| Press / feature | publication, submissions, feature form | `content-creator` |
| Noise | unrelated, expired, scam, pay-to-pitch | Stop and say so |

## Step 3 — Qualify

Apply the `fundraiser` qualification table for funding types. For creator recruits, judge form quality, manufacturability of their work (solid, flat-based, sub-250mm for the US tier), and audience size.

Flag immediately: expired deadlines, pay-to-apply schemes, and anything demanding exclusivity or IP assignment.

## Step 4 — Act

Produce, without being asked again:

```
WHAT IT IS: <one line>
DEADLINE: <date or "none stated">
FIT: pursue / skip — <reason>
PREPARED: <draft email / DM / application answers>
```

- Applications and investor emails → draft into Gmail drafts, never send.
- Creator recruits → draft the DM using the `creator-economy-expert` offer line.
- Never submit an external application, pay a fee, or DM a stranger without explicit approval in that message.

If the link is unreachable, say so plainly and ask for a screenshot rather than inventing contents.