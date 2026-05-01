// Prerender edge function for SEO bots.
// Returns clean static HTML (with title, meta description, OG tags, JSON-LD)
// for /product/:slug and /designer/:slug. Real users still get the SPA;
// you must route bot traffic (Googlebot, Bingbot, etc.) to this function
// at the CDN layer (e.g. Cloudflare Worker user-agent check).
//
// Usage:
//   GET https://<project>.functions.supabase.co/prerender?path=/product/my-chair
//
// Public, no JWT required.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://nyzora.ai";
const DEFAULT_OG = `${SITE}/og-default.png`;
const LOGO = `${SITE}/favicon.png`;
const SUPPORT_EMAIL = "contact@nyzora.ai";
const PRICE_VALID_UNTIL = "2027-12-31";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const xmlEscape = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (s: string, n: number) => {
  const clean = String(s ?? "").replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1) + "…" : clean;
};

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "product" | "profile";
  /** One or more JSON-LD blocks. Each becomes its own <script type="application/ld+json"> tag. */
  jsonLd?: Record<string, any> | Record<string, any>[];
  bodyHeading?: string; // visible H1 for crawlers
  bodyText?: string;    // visible paragraph
}

function renderHtml(meta: Meta): string {
  const title = `${truncate(meta.title, 65)} | Nyzora`;
  const desc = truncate(meta.description, 160);
  const ldArray = meta.jsonLd
    ? Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd]
    : [];
  const jsonLdScript = ldArray
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${xmlEscape(title)}</title>
<meta name="description" content="${xmlEscape(desc)}" />
<link rel="canonical" href="${xmlEscape(meta.url)}" />
<meta name="robots" content="index, follow" />

<meta property="og:title" content="${xmlEscape(meta.title)}" />
<meta property="og:description" content="${xmlEscape(desc)}" />
<meta property="og:image" content="${xmlEscape(meta.image)}" />
<meta property="og:url" content="${xmlEscape(meta.url)}" />
<meta property="og:type" content="${meta.type}" />
<meta property="og:site_name" content="Nyzora" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${xmlEscape(meta.title)}" />
<meta name="twitter:description" content="${xmlEscape(desc)}" />
<meta name="twitter:image" content="${xmlEscape(meta.image)}" />

${jsonLdScript}
</head>
<body>
<h1>${xmlEscape(meta.bodyHeading || meta.title)}</h1>
<p>${xmlEscape(meta.bodyText || desc)}</p>
<p><a href="${xmlEscape(meta.url)}">View on Nyzora</a></p>
</body>
</html>`;
}

function fallbackHtml(path: string): string {
  return renderHtml({
    title: "Nyzora — Creator-Designed, Made-to-Order Furniture",
    description:
      "Discover original furniture designed by creators worldwide. Each piece is exclusive to Nyzora and made to order.",
    image: DEFAULT_OG,
    url: `${SITE}${path || "/"}`,
    type: "website",
  });
}

async function renderProduct(supabase: any, slug: string, path: string): Promise<string> {
  // Try slug first, then UUID fallback
  let { data } = await supabase
    .from("designer_products")
    .select("id, name, description, image_url, designer_price, category, slug, designer_profiles!inner(name, slug)")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!data) {
    const res = await supabase
      .from("designer_products")
      .select("id, name, description, image_url, designer_price, category, slug, designer_profiles!inner(name, slug)")
      .eq("id", slug)
      .eq("status", "approved")
      .maybeSingle();
    data = res.data;
  }

  if (!data) return fallbackHtml(path);

  const creator = (data as any).designer_profiles?.name || "Nyzora Creator";
  const url = `${SITE}/product/${(data as any).slug || (data as any).id}`;
  const image = (data as any).image_url || DEFAULT_OG;
  const description =
    (data as any).description ||
    `${(data as any).name} — designed by ${creator}. Made to order, exclusive to Nyzora.`;

  return renderHtml({
    title: `${(data as any).name} by ${creator}`,
    description,
    image,
    url,
    type: "product",
    bodyHeading: (data as any).name,
    bodyText: `Designed by ${creator}. ${truncate(description, 300)}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: (data as any).name,
      description: truncate(description, 500),
      image,
      url,
      brand: { "@type": "Brand", name: "Nyzora" },
      category: (data as any).category,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "INR",
        price: (data as any).designer_price ?? undefined,
        availability: "https://schema.org/MadeToOrder",
      },
    },
  });
}

async function renderCreator(supabase: any, slug: string, path: string): Promise<string> {
  let { data } = await supabase
    .from("designer_profiles")
    .select("id, name, bio, avatar_url, slug")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!data) {
    const res = await supabase
      .from("designer_profiles")
      .select("id, name, bio, avatar_url, slug")
      .eq("id", slug)
      .eq("status", "approved")
      .maybeSingle();
    data = res.data;
  }

  if (!data) return fallbackHtml(path);

  const url = `${SITE}/designer/${(data as any).slug || (data as any).id}`;
  const image = (data as any).avatar_url || DEFAULT_OG;
  const description =
    (data as any).bio ||
    `${(data as any).name} — verified creator on Nyzora. Browse original, made-to-order furniture and home objects.`;

  return renderHtml({
    title: `${(data as any).name} — Creator on Nyzora`,
    description,
    image,
    url,
    type: "profile",
    bodyHeading: (data as any).name,
    bodyText: truncate(description, 400),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: (data as any).name,
      description: truncate(description, 500),
      image,
      url,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Accept ?path=/product/foo OR derive from request path after /prerender
    let path = url.searchParams.get("path") || "";
    if (!path) {
      // Strip /functions/v1/prerender prefix if present
      path = url.pathname.replace(/^\/functions\/v1\/prerender/, "").replace(/^\/prerender/, "");
    }
    if (!path.startsWith("/")) path = "/" + path;

    // Basic safety: only allow simple paths
    if (path.length > 500 || /[\x00-\x1f]/.test(path)) {
      return new Response(fallbackHtml("/"), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const productMatch = path.match(/^\/product\/([^/?#]+)/);
    const creatorMatch = path.match(/^\/designer\/([^/?#]+)/);

    let html: string;
    if (productMatch) {
      html = await renderProduct(supabase, decodeURIComponent(productMatch[1]), path);
    } else if (creatorMatch) {
      html = await renderCreator(supabase, decodeURIComponent(creatorMatch[1]), path);
    } else {
      html = fallbackHtml(path);
    }

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=3600",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (err) {
    console.error("prerender error", err);
    return new Response(fallbackHtml("/"), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
