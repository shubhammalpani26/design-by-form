// Dynamic sitemap.xml generator. Public, no JWT.
// Lists all approved products, approved creator profiles, makers, and static routes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://nyzora.ai";

const STATIC_ROUTES: { path: string; changefreq: string; priority: number }[] = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/browse", changefreq: "daily", priority: 0.9 },
  { path: "/explore", changefreq: "daily", priority: 0.9 },
  { path: "/creators", changefreq: "weekly", priority: 0.8 },
  { path: "/verified-makers", changefreq: "weekly", priority: 0.8 },
  { path: "/design-studio", changefreq: "weekly", priority: 0.8 },
  { path: "/about", changefreq: "monthly", priority: 0.6 },
  { path: "/how-it-works", changefreq: "monthly", priority: 0.7 },
  { path: "/technology", changefreq: "monthly", priority: 0.6 },
  { path: "/contact", changefreq: "monthly", priority: 0.5 },
  { path: "/plans", changefreq: "monthly", priority: 0.6 },
  { path: "/designer-signup", changefreq: "monthly", priority: 0.7 },
  { path: "/maker-faq", changefreq: "monthly", priority: 0.4 },
  { path: "/creator-faq", changefreq: "monthly", priority: 0.4 },
  { path: "/shopper-faq", changefreq: "monthly", priority: 0.4 },
  { path: "/privacy-policy", changefreq: "yearly", priority: 0.2 },
  { path: "/terms", changefreq: "yearly", priority: 0.2 },
];

// Maker slugs (kept in sync with src/data/makers.ts)
const MAKER_SLUGS = ["cyanique", "sach-creations", "beni-enterprise"];

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const urlEntry = (loc: string, lastmod?: string, changefreq?: string, priority?: number) => `  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.split("T")[0]}</lastmod>` : ""}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""}${priority !== undefined ? `\n    <priority>${priority.toFixed(1)}</priority>` : ""}
  </url>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [productsRes, creatorsRes] = await Promise.all([
      supabase
        .from("designer_products")
        .select("slug, id, updated_at")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("designer_profiles")
        .select("slug, id, updated_at")
        .eq("status", "approved")
        .limit(2000),
    ]);

    const urls: string[] = [];

    for (const r of STATIC_ROUTES) {
      urls.push(urlEntry(`${SITE}${r.path}`, undefined, r.changefreq, r.priority));
    }

    for (const p of productsRes.data ?? []) {
      const slug = (p as any).slug || (p as any).id;
      urls.push(urlEntry(`${SITE}/product/${slug}`, (p as any).updated_at, "weekly", 0.8));
    }

    for (const c of creatorsRes.data ?? []) {
      const slug = (c as any).slug || (c as any).id;
      urls.push(urlEntry(`${SITE}/designer/${slug}`, (c as any).updated_at, "weekly", 0.7));
    }

    for (const slug of MAKER_SLUGS) {
      urls.push(urlEntry(`${SITE}/maker/${slug}`, undefined, "monthly", 0.6));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("sitemap error", err);
    return new Response("error", { status: 500 });
  }
});
