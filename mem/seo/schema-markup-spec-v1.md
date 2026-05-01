---
name: Nyzora schema markup spec v1
description: JSON-LD schema spec implemented per Nyzora_Schema_Markup.pdf — Org+WebSite homepage, Person+Breadcrumb+ItemList designer pages, [Product,CreativeWork]+Breadcrumb product pages
type: feature
---
Implements the schema spec from "Nyzora Schema Markup" PDF.

**Scope:** SPA can't do true SSR. Schema is delivered to bots via the `prerender` edge function (see mem://seo/prerender-edge-function) AND duplicated client-side via `<JsonLd>` for any non-bot crawler that does render JS.

**Per-route schema:**
- `/` — `Organization` (#organization with logo, sameAs IG+LinkedIn, contactPoint contact@nyzora.ai) + `WebSite` (#website with SearchAction urlTemplate `/browse?q=`). Defined in `src/pages/Home.tsx` and `prerender` fallbackHtml.
- `/designer/:slug` — `Person` (#person, jobTitle "Furniture Designer", knowsAbout, worksFor → #organization) + `BreadcrumbList` (Home > Designers `/creators` > Name) + `ItemList` of approved products. Defined in `src/pages/DesignerProfile.tsx` and `prerender` renderCreator.
- `/product/:slug` — `["Product", "CreativeWork"]` multi-type so `creator` accepts a Person; full Offer with priceCurrency INR, `priceValidUntil: 2027-12-31`, itemCondition NewCondition, availability InStock, seller → #organization. Includes `material`, `weight` (KGM), `sku` (NYZ-<id8>). Plus `BreadcrumbList`. Defined in `src/pages/ProductDetail.tsx` and `prerender` renderProduct.

**Adaptations vs PDF:**
- Search URL `/browse?q=` (not `/search?q=`)
- Breadcrumb "Designers" → `/creators`, "Products" → `/browse` (real app routes)
- `priceValidUntil` bumped to 2027-12-31 (we are in May 2026)
- `designer_profiles` columns: `design_background` (bio), `profile_picture_url` (avatar), `portfolio_url` (sameAs), `furniture_interests` (knowsAbout). No instagram/behance/linkedin columns yet.

**Bot routing still requires CDN worker** to forward Googlebot/Bingbot to the prerender endpoint before SPA serves index.html.
