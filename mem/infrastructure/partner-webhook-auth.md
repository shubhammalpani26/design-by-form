---
name: Partner Webhook Auth & URL
description: How Slant 3D partner webhooks are authenticated (HMAC-SHA256) and the correct function URL to register — NOT the custom domain
type: reference
---
US print-partner webhooks (Slant 3D) land at the **Supabase function URL**, not the custom domain:
`https://<project-ref>.supabase.co/functions/v1/partner-webhook`

The custom domain (`nyzora.ai/functions/v1/...`) returns the SPA HTML (frontend catch-all) — never use it for partner webhooks. The `<project-ref>.supabase.co/functions/v1/<name>` path is reachable without an apikey/JWT (verify_jwt=false).

**Auth = HMAC-SHA256, not a shared secret.** Slant 3D signs every request:
- Header `X-Webhook-Timestamp` (millis) + `X-Webhook-Signature-256` (`sha256=<hex>`).
- Signature = `HMAC-SHA256(webhookSecret, "${timestamp}.${rawBody}")` hex. Reject if older than 5 min.
- `webhookSecret` is auto-generated on the Slant 3D platform record (visible in their dashboard, also readable via `GET /platforms/{id}` with SLANT3D_API_KEY). Stored as `PARTNER_WEBHOOK_SECRET`.

`partner-webhook/index.ts` verifies the signature with Web Crypto + constant-time compare, then maps `event_type` (e.g. `order.shipped`) → buyer-facing `production_status`, logs an admin-only timeline row via `logPartnerEvent`, and triggers `originals-tracking-sync` on shipped/delivered. Unknown events map to `in_production`.

The `webhookURL` is set on the platform via `PATCH /platforms/{SLANT3D_PLATFORM_ID}` `{ "webhookURL": "<url>" }`. Verified 2026-08-23: valid sig → 200, tampered → 401.
