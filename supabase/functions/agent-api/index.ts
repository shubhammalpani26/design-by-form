import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SITE_URL = "https://nyzora.ai";
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      ...extra,
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Path looks like: /agent-api/<resource>/<...>
  const parts = url.pathname.split("/").filter(Boolean);
  const fnIdx = parts.indexOf("agent-api");
  const route = parts.slice(fnIdx + 1);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET /agent-api  -> service descriptor
    if (route.length === 0) {
      return json({
        name: "Nyzora Agent API",
        version: "1.0",
        description:
          "Read-only catalog + checkout-initiation endpoints for AI shopping agents. Payment is completed by the user on nyzora.ai.",
        site: SITE_URL,
        endpoints: {
          products: "/agent-api/products?limit=&offset=&category=&q=",
          product: "/agent-api/products/{id_or_slug}",
          creators: "/agent-api/creators?limit=&offset=",
          creator: "/agent-api/creators/{id_or_slug}",
          categories: "/agent-api/categories",
          checkout_intent: "POST /agent-api/checkout-intent { items: [{slug|id, quantity}] }",
        },
        product_feed: `${SITE_URL.replace("nyzora.ai", "rdcfakdhgndnhgzfkuvw.supabase.co")}/functions/v1/products-feed`,
        notes:
          "All prices in INR. Products are made-to-order. Checkout-intent returns a deep link for the user to complete payment.",
      });
    }

    // GET /agent-api/categories
    if (route[0] === "categories" && route.length === 1) {
      const { data, error } = await supabase
        .from("designer_products")
        .select("category")
        .eq("status", "approved");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
      });
      return json({
        categories: Object.entries(counts)
          .map(([slug, count]) => ({ slug, count, url: `${SITE_URL}/browse?category=${slug}` }))
          .sort((a, b) => b.count - a.count),
      });
    }

    // GET /agent-api/products
    if (route[0] === "products" && route.length === 1) {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
      const category = url.searchParams.get("category");
      const q = url.searchParams.get("q");
      let query = supabase
        .from("designer_products")
        .select(
          "id, slug, name, description, category, designer_price, image_url, lead_time_days, designer_profiles!inner(id, name, slug)",
          { count: "exact" }
        )
        .eq("status", "approved")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (category) query = query.eq("category", category);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      return json({
        total: count ?? null,
        limit,
        offset,
        products: (data || []).map((p: any) => formatProductSummary(p)),
      });
    }

    // GET /agent-api/products/{id_or_slug}
    if (route[0] === "products" && route.length === 2) {
      const key = decodeURIComponent(route[1]);
      const { data: bySlug } = await supabase
        .from("designer_products")
        .select(
          "id, slug, name, description, category, designer_price, image_url, weight, dimensions, available_finishes, available_sizes, lead_time_days, materials_description, total_sales, created_at, updated_at, designer_profiles!inner(id, name, slug)"
        )
        .eq("status", "approved")
        .eq("slug", key)
        .maybeSingle();

      let product: any = bySlug;
      if (!product) {
        const isUuid = /^[0-9a-f-]{36}$/i.test(key);
        if (isUuid) {
          const { data: byId } = await supabase
            .from("designer_products")
            .select(
              "id, slug, name, description, category, designer_price, image_url, weight, dimensions, available_finishes, available_sizes, lead_time_days, materials_description, total_sales, created_at, updated_at, designer_profiles!inner(id, name, slug)"
            )
            .eq("status", "approved")
            .eq("id", key)
            .maybeSingle();
          product = byId;
        }
      }
      if (!product) return json({ error: "Product not found" }, 404);
      return json(formatProductDetail(product));
    }

    // GET /agent-api/creators
    if (route[0] === "creators" && route.length === 1) {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
      const { data, error } = await supabase
        .from("designer_profiles")
        .select("id, slug, name, design_background, profile_picture_url")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return json({
        limit,
        offset,
        creators: (data || []).map((c: any) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          bio: c.design_background,
          avatar: c.profile_picture_url,
          url: `${SITE_URL}/designer/${c.slug || c.id}`,
        })),
      });
    }

    // GET /agent-api/creators/{id_or_slug}
    if (route[0] === "creators" && route.length === 2) {
      const key = decodeURIComponent(route[1]);
      const isUuid = /^[0-9a-f-]{36}$/i.test(key);
      const { data: creator } = await supabase
        .from("designer_profiles")
        .select(
          "id, slug, name, design_background, furniture_interests, portfolio_url, profile_picture_url, cover_image_url, created_at"
        )
        .eq("status", "approved")
        .eq(isUuid ? "id" : "slug", key)
        .maybeSingle();
      if (!creator) return json({ error: "Creator not found" }, 404);

      const { data: products } = await supabase
        .from("designer_products")
        .select("id, slug, name, category, designer_price, image_url")
        .eq("status", "approved")
        .eq("designer_id", creator.id)
        .order("created_at", { ascending: false });

      return json({
        id: creator.id,
        slug: creator.slug,
        name: creator.name,
        bio: creator.design_background,
        interests: creator.furniture_interests,
        portfolio_url: creator.portfolio_url,
        avatar: creator.profile_picture_url,
        cover: creator.cover_image_url,
        url: `${SITE_URL}/designer/${creator.slug || creator.id}`,
        joined_at: creator.created_at,
        products: (products || []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.name,
          category: p.category,
          price: Number(p.designer_price),
          currency: "INR",
          image: p.image_url,
          url: `${SITE_URL}/product/${p.slug || p.id}`,
        })),
      });
    }

    // POST /agent-api/checkout-intent
    if (route[0] === "checkout-intent" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body || !Array.isArray(body.items) || body.items.length === 0) {
        return json({ error: "Body must be { items: [{ slug|id, quantity }] }" }, 400);
      }
      if (body.items.length > 20) {
        return json({ error: "Max 20 items per checkout intent" }, 400);
      }

      const resolved: any[] = [];
      let subtotal = 0;
      for (const raw of body.items) {
        const key = String(raw.slug || raw.id || "").trim();
        const qty = Math.max(1, Math.min(parseInt(String(raw.quantity || 1), 10) || 1, 50));
        if (!key) continue;
        const isUuid = /^[0-9a-f-]{36}$/i.test(key);
        const { data: p } = await supabase
          .from("designer_products")
          .select("id, slug, name, designer_price, image_url, lead_time_days")
          .eq("status", "approved")
          .eq(isUuid ? "id" : "slug", key)
          .maybeSingle();
        if (!p) {
          return json({ error: `Product not found: ${key}` }, 404);
        }
        const lineTotal = Number(p.designer_price) * qty;
        subtotal += lineTotal;
        resolved.push({
          id: p.id,
          slug: p.slug,
          title: p.name,
          quantity: qty,
          unit_price: Number(p.designer_price),
          line_total: lineTotal,
          currency: "INR",
          image: p.image_url,
          lead_time_days: p.lead_time_days,
          url: `${SITE_URL}/product/${p.slug || p.id}`,
        });
      }

      // Build a deep link to the cart page with prefilled items
      const cartParam = encodeURIComponent(
        JSON.stringify(resolved.map((r) => ({ id: r.id, qty: r.quantity })))
      );
      const checkoutUrl = `${SITE_URL}/cart?prefill=${cartParam}`;

      return json({
        currency: "INR",
        subtotal,
        items: resolved,
        checkout_url: checkoutUrl,
        instructions:
          "Open checkout_url in a browser. The user must sign in and complete payment on nyzora.ai. Shipping, GST, and any customizations are calculated during checkout.",
      });
    }

    return json({ error: "Not found", path: url.pathname }, 404);
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function formatProductSummary(p: any) {
  const slug = p.slug || p.id;
  return {
    id: p.id,
    slug,
    title: p.name,
    description: p.description?.slice(0, 280) || "",
    category: p.category,
    price: Number(p.designer_price),
    currency: "INR",
    image: p.image_url,
    lead_time_days: p.lead_time_days,
    creator: {
      id: p.designer_profiles?.id,
      name: p.designer_profiles?.name,
      url: `${SITE_URL}/designer/${p.designer_profiles?.slug || p.designer_profiles?.id}`,
    },
    url: `${SITE_URL}/product/${slug}`,
  };
}

function formatProductDetail(p: any) {
  const slug = p.slug || p.id;
  return {
    id: p.id,
    slug,
    title: p.name,
    description: p.description || "",
    category: p.category,
    price: Number(p.designer_price),
    currency: "INR",
    availability: "in_stock",
    condition: "new",
    brand: "Nyzora",
    image: p.image_url,
    weight_kg: p.weight ? Number(p.weight) : null,
    dimensions_cm: p.dimensions || null,
    finishes: p.available_finishes || [],
    sizes: p.available_sizes || [],
    lead_time_days: p.lead_time_days,
    materials: p.materials_description,
    total_sales: p.total_sales,
    creator: {
      id: p.designer_profiles?.id,
      name: p.designer_profiles?.name,
      url: `${SITE_URL}/designer/${p.designer_profiles?.slug || p.designer_profiles?.id}`,
    },
    url: `${SITE_URL}/product/${slug}`,
    checkout_intent_example: {
      method: "POST",
      url: `${SITE_URL.replace("nyzora.ai", "rdcfakdhgndnhgzfkuvw.supabase.co")}/functions/v1/agent-api/checkout-intent`,
      body: { items: [{ slug, quantity: 1 }] },
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}