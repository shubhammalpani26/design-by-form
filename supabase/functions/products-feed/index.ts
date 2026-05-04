import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SITE_URL = "https://nyzora.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "json").toLowerCase();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "500", 10), 1000);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
    const category = url.searchParams.get("category");

    // Detect /products-feed/extended vs standard /products-feed
    const parts = url.pathname.split("/").filter(Boolean);
    const fnIdx = parts.indexOf("products-feed");
    const sub = parts.slice(fnIdx + 1)[0] || "";
    const extended = sub === "extended" || url.searchParams.get("extended") === "1";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("designer_products")
      .select(
        "id, slug, name, description, category, designer_price, image_url, weight, dimensions, available_finishes, available_sizes, lead_time_days, materials_description, total_sales, created_at, updated_at, designer_profiles!inner(id, name, slug)"
      )
      .eq("status", "approved")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    const products = (data || []).map((p: any) => {
      const slug = p.slug || p.id;
      const creatorSlug = p.designer_profiles?.slug || p.designer_profiles?.id;
      // Standard fields aligned with Google Merchant + Schema.org Product
      const base = {
        id: p.id,
        sku: p.id,
        slug,
        title: p.name,
        description: p.description || "",
        category: p.category,
        url: `${SITE_URL}/product/${slug}`,
        image: p.image_url,
        price: Number(p.designer_price),
        currency: "INR",
        availability: "in_stock",
        condition: "new",
        brand: "Nyzora",
        identifier_exists: false,
        shipping: { country: "IN", service: "Standard", price: 0, currency: "INR" },
      };
      if (!extended) return base;
      // Extended Nyzora-specific fields
      return {
        ...base,
        creator: {
          id: p.designer_profiles?.id,
          name: p.designer_profiles?.name,
          url: creatorSlug ? `${SITE_URL}/designer/${creatorSlug}` : null,
        },
        weight_kg: p.weight ? Number(p.weight) : null,
        dimensions_cm: p.dimensions || null,
        finishes: p.available_finishes || [],
        sizes: p.available_sizes || [],
        lead_time_days: p.lead_time_days,
        materials: p.materials_description,
        total_sales: p.total_sales,
        customizable: true,
        made_to_order: true,
        production_method: "custom_manufactured",
        warranty_years: 2,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    if (format === "xml" || format === "rss") {
      // Google Merchant-style RSS feed
      const items = products
        .map(
          (p) => `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description || p.title)}</description>
      <link>${escapeXml(p.url)}</link>
      <g:image_link>${escapeXml(p.image)}</g:image_link>
      <g:price>${p.price.toFixed(2)} ${p.currency}</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Nyzora</g:brand>
      <g:product_type>${escapeXml(p.category || "")}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`
        )
        .join("");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Nyzora Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Original furniture and decor by independent creators</description>${items}
  </channel>
</rss>`;

      return new Response(xml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return new Response(
      JSON.stringify(
        {
          version: "1.0",
          feed: extended ? "extended" : "standard",
          site: SITE_URL,
          generated_at: new Date().toISOString(),
          count: products.length,
          limit,
          offset,
          schema: extended
            ? "Google Merchant baseline + Nyzora extensions (creator, materials, dimensions, finishes, lead_time_days, customizable, made_to_order, warranty_years)"
            : "Google Merchant baseline + Schema.org Product",
          products,
        },
        null,
        2
      ),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeXml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}