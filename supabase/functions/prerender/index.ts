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

const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "Nyzora",
  alternateName: "Nyzora.ai",
  url: SITE,
  logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 },
  description:
    "Creator-designed furniture marketplace featuring unique, sustainable pieces from independent designers.",
  sameAs: [
    "https://www.instagram.com/nyzora.ai",
    "https://www.linkedin.com/company/nyzora",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: SUPPORT_EMAIL,
    contactType: "customer support",
  },
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: SITE,
  name: "Nyzora",
  publisher: { "@id": `${SITE}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE}/browse?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

function fallbackHtml(path: string): string {
  const isHome = !path || path === "/" || path === "";
  return renderHtml({
    title: isHome
      ? "Nyzora — Creator-Designed Furniture & Sculpture Marketplace"
      : "Nyzora — Creator-Designed, Made-to-Order Furniture",
    description: isHome
      ? "Nyzora — the marketplace for creator-designed, sustainable furniture. Shop unique chairs, benches and sculptures from indie designers."
      : "Discover original furniture designed by creators worldwide. Each piece is exclusive to Nyzora and made to order.",
    image: DEFAULT_OG,
    url: `${SITE}${path || "/"}`,
    type: "website",
    bodyHeading: isHome
      ? "Furniture Designed by Independent Creators"
      : undefined,
    jsonLd: [ORGANIZATION_LD, WEBSITE_LD],
  });
}

async function renderProduct(supabase: any, slug: string, path: string): Promise<string> {
  // Try slug first, then UUID fallback
  let { data } = await supabase
    .from("designer_products")
    .select("id, name, description, image_url, designer_price, category, slug, materials_description, dimensions, weight, designer_profiles!inner(name, slug)")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!data) {
    const res = await supabase
      .from("designer_products")
      .select("id, name, description, image_url, designer_price, category, slug, materials_description, dimensions, weight, designer_profiles!inner(name, slug)")
      .eq("id", slug)
      .eq("status", "approved")
      .maybeSingle();
    data = res.data;
  }

  if (!data) return fallbackHtml(path);

  const d = data as any;
  const creator = d.designer_profiles?.name || "Nyzora Creator";
  const creatorSlug = d.designer_profiles?.slug || "";
  const productSlug = d.slug || d.id;
  const url = `${SITE}/product/${productSlug}`;
  const image = d.image_url || DEFAULT_OG;
  const description =
    d.description || `${d.name} — designed by ${creator}. Made to order, exclusive to Nyzora.`;
  const sku = `NYZ-${String(productSlug).toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 24)}`;
  const skuShort = `NYZ-${d.id.slice(0, 8).toUpperCase()}`;

  const productLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": ["Product", "CreativeWork"],
    "@id": `${url}#product`,
    name: d.name,
    url,
    image: [image],
    description: truncate(description, 800),
    sku: skuShort,
    category: d.category,
    brand: { "@type": "Brand", name: "Nyzora" },
    creator: {
      "@type": "Person",
      ...(creatorSlug ? { "@id": `${SITE}/designer/${creatorSlug}#person` } : {}),
      name: creator,
      ...(creatorSlug ? { url: `${SITE}/designer/${creatorSlug}` } : {}),
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: d.designer_price != null ? String(d.designer_price) : undefined,
      priceValidUntil: PRICE_VALID_UNTIL,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", "@id": `${SITE}/#organization` },
    },
  };
  if (d.materials_description) productLd.material = d.materials_description;
  if (d.weight) productLd.weight = { "@type": "QuantitativeValue", value: d.weight, unitCode: "KGM" };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${SITE}/browse` },
      { "@type": "ListItem", position: 3, name: d.name, item: url },
    ],
  };

  return renderHtml({
    title: `${d.name} by ${creator}`,
    description,
    image,
    url,
    type: "product",
    bodyHeading: d.name,
    bodyText: `Designed by ${creator}. ${truncate(description, 300)}`,
    jsonLd: [productLd, breadcrumbLd],
  });
}

async function renderCreator(supabase: any, slug: string, path: string): Promise<string> {
  const cols =
    "id, name, slug, design_background, furniture_interests, portfolio_url, profile_picture_url";
  let { data } = await supabase
    .from("designer_profiles")
    .select(cols)
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!data) {
    const res = await supabase
      .from("designer_profiles")
      .select(cols)
      .eq("id", slug)
      .eq("status", "approved")
      .maybeSingle();
    data = res.data;
  }

  if (!data) return fallbackHtml(path);

  const d = data as any;
  const designerSlug = d.slug || d.id;
  const url = `${SITE}/designer/${designerSlug}`;
  const image = d.profile_picture_url || DEFAULT_OG;
  const description =
    d.design_background ||
    `${d.name} — verified creator on Nyzora. Browse original, made-to-order furniture and home objects.`;

  // Fetch this designer's approved products for ItemList
  const { data: products } = await supabase
    .from("designer_products")
    .select("name, slug, id")
    .eq("designer_id", d.id)
    .eq("status", "approved")
    .limit(20);

  const personLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name: d.name,
    url,
    image,
    jobTitle: "Furniture Designer",
    description: truncate(description, 800),
    knowsAbout: [
      "Furniture Design",
      "Sustainable Design",
      ...(d.furniture_interests ? [d.furniture_interests] : []),
    ],
    worksFor: { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Nyzora" },
  };
  if (d.portfolio_url) personLd.sameAs = [d.portfolio_url];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Designers", item: `${SITE}/creators` },
      { "@type": "ListItem", position: 3, name: d.name, item: url },
    ],
  };

  const blocks: Record<string, any>[] = [personLd, breadcrumbLd];
  if (products && products.length > 0) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Products by ${d.name}`,
      itemListElement: products.map((p: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/product/${p.slug || p.id}`,
        name: p.name,
      })),
    });
  }

  return renderHtml({
    title: `${d.name} — Furniture Designer`,
    description,
    image,
    url,
    type: "profile",
    bodyHeading: d.name,
    bodyText: truncate(description, 400),
    jsonLd: blocks,
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
