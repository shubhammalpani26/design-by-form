---
name: Prerender Edge Function for Bots
description: SEO prerender edge function returning static HTML with title/desc/OG/JSON-LD for bot traffic on /product/:slug and /designer/:slug
type: feature
---
Edge function `prerender` returns clean SSR HTML for crawlers.

**Endpoint:** `https://rdcfakdhgndnhgzfkuvw.functions.supabase.co/prerender?path=/product/<slug>`
Also accepts `/designer/<slug>`. Falls back to slug→UUID lookup. Unknown paths return generic Nyzora HTML (status 200, never 404 for crawlers).

**Returned HTML contains:**
- `<title>`, `<meta description>`, canonical, robots
- Open Graph + Twitter Card tags with real image_url
- JSON-LD: Product schema (with Offer/MadeToOrder) or Person schema
- Visible `<h1>` + paragraph for crawler text content

**Wiring (user task):** Must route Googlebot/Bingbot user-agents at CDN (Cloudflare Worker) to this endpoint before the SPA serves index.html. Real users still get the SPA.

**Cache:** s-maxage=3600, max-age=600. Public, no JWT.