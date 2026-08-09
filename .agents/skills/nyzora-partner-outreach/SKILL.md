---
name: nyzora-partner-outreach
description: Draft and manage outreach to Nyzora's manufacturing and integration partners. Triggers on "draft email", "partner outreach", "API down", "escalate", "Slant 3D", or "manufacturing partner".
---

# Nyzora Partner Outreach

## Context

Nyzora is an AI design-to-manufacturing marketplace. US manufacturing runs through Slant 3D's API. The partner API has historically returned `502 Bad Gateway` during outages. The project's direct Supabase project ref is `rdcfakdhgndnhgzfkuvw`. API health can be checked with a `GET` or `POST` to `https://www.slant3dapi.com/api/` endpoints.

## Before drafting any partner email

1. Verify the current API state by hitting the relevant endpoint with the stored `SLANT3D_API_KEY` (or a no-key request to a non-existent path) to distinguish a partner outage from an authentication problem.
   - `502 Bad Gateway` from nginx → partner-side outage, not our key.
   - `401`/`403` JSON error → key or permission issue.
2. Gather the exact impact: which Nyzora features are blocked, how long it has been failing, and what the business needs (pricing, fulfillment, sandbox, status page).

## Drafting the email

- Address both `support@slant3d.com` and `dev4@slant3d.com` when available.
- Keep the tone professional, specific, and impact-focused.
- Include:
  - Who Nyzora is and the integration purpose.
  - The exact error observed (status code, endpoint, timestamp).
  - Evidence that the key is not the cause (if true).
  - The business impact (e.g., "blocking US creator launch").
  - Concrete asks: outage status/ETA, status page or webhook, sandbox environment, dedicated escalation contact.
- Save the draft via the Gmail connector if linked; otherwise return the full text for the user to send.
- Never send an email without explicit user approval.

## Follow-up actions

- If the API recovers, run a test quote through `supabase/functions/slant3d-quote` and confirm the first real price with the user.
- If the partner requests a `platform-id` header or new credential, route through the secrets workflow and update `supabase/functions/_shared/slant3d.ts`.
