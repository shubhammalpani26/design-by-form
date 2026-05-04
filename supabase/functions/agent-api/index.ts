import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SITE_URL = "https://nyzora.ai";
const FUNCTIONS_BASE = "https://rdcfakdhgndnhgzfkuvw.supabase.co/functions/v1";
const AGENT_BASE = `${FUNCTIONS_BASE}/agent-api`;

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
    // GET /agent-api/openapi.json -> OpenAPI spec
    if (route[0] === "openapi.json") {
      return json(buildOpenApiSpec(), 200, { "Cache-Control": "public, max-age=3600" });
    }

    // GET /agent-api/.well-known/ai-plugin.json (also exposed at /agent-api/ai-plugin.json)
    if (
      route[0] === "ai-plugin.json" ||
      (route[0] === ".well-known" && route[1] === "ai-plugin.json")
    ) {
      return json(
        {
          schema_version: "v1",
          name_for_human: "Nyzora",
          name_for_model: "nyzora",
          description_for_human:
            "Browse and order AI-designed, made-to-order furniture and decor from independent creators on Nyzora.",
          description_for_model:
            "Use the Nyzora Agent API to search products, look up creators, check availability and lead times, and create checkout intents that deep-link the user back to nyzora.ai to complete payment. Currency is INR. Products are made-to-order.",
          auth: { type: "none" },
          api: { type: "openapi", url: `${AGENT_BASE}/openapi.json` },
          logo_url: `${SITE_URL}/favicon.ico`,
          contact_email: "contact@nyzora.ai",
          legal_info_url: `${SITE_URL}/terms`,
        },
        200,
        { "Cache-Control": "public, max-age=3600" }
      );
    }

    // GET /agent-api  -> service descriptor
    if (route.length === 0) {
      return json({
        name: "Nyzora Agent API",
        version: "1.1",
        description:
          "Read-only catalog + checkout-initiation endpoints for AI shopping agents. Payment is completed by the user on nyzora.ai.",
        site: SITE_URL,
        endpoints: {
          products: "/agent-api/products?limit=&offset=&category=&q=",
          product: "/agent-api/products/{id_or_slug}",
          product_availability: "/agent-api/products/{id_or_slug}/availability",
          search:
            "/agent-api/search?q=&min_price=&max_price=&category=&material=&finish=&max_lead_days=&limit=&offset=",
          creators: "/agent-api/creators?limit=&offset=",
          creators_featured: "/agent-api/creators/featured?limit=",
          creators_by_category: "/agent-api/creators?category=&limit=&offset=",
          creator: "/agent-api/creators/{id_or_slug}",
          categories: "/agent-api/categories",
          checkout_intent: "POST /agent-api/checkout-intent { items: [{slug|id, quantity}] }",
          order: "GET /agent-api/orders/{id} (requires user JWT)",
          openapi: "/agent-api/openapi.json",
          ai_plugin: "/agent-api/.well-known/ai-plugin.json",
        },
        product_feed: {
          standard: `${FUNCTIONS_BASE}/products-feed`,
          extended: `${FUNCTIONS_BASE}/products-feed/extended`,
          xml: `${FUNCTIONS_BASE}/products-feed?format=xml`,
        },
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

    // GET /agent-api/search
    if (route[0] === "search" && route.length === 1) {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
      const q = url.searchParams.get("q");
      const category = url.searchParams.get("category");
      const minPrice = parseFloat(url.searchParams.get("min_price") || "");
      const maxPrice = parseFloat(url.searchParams.get("max_price") || "");
      const material = url.searchParams.get("material");
      const finish = url.searchParams.get("finish");
      const maxLead = parseInt(url.searchParams.get("max_lead_days") || "", 10);

      let query = supabase
        .from("designer_products")
        .select(
          "id, slug, name, description, category, designer_price, image_url, lead_time_days, available_finishes, materials_description, designer_profiles!inner(id, name, slug)",
          { count: "exact" }
        )
        .eq("status", "approved")
        .not("image_url", "is", null);

      if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      if (category) query = query.eq("category", category);
      if (!Number.isNaN(minPrice)) query = query.gte("designer_price", minPrice);
      if (!Number.isNaN(maxPrice)) query = query.lte("designer_price", maxPrice);
      if (!Number.isNaN(maxLead)) query = query.lte("lead_time_days", maxLead);
      if (material) query = query.ilike("materials_description", `%${material}%`);
      if (finish) query = query.contains("available_finishes", [finish]);

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return json({
        total: count ?? null,
        limit,
        offset,
        filters: { q, category, min_price: minPrice || null, max_price: maxPrice || null, material, finish, max_lead_days: maxLead || null },
        results: (data || []).map((p: any) => formatProductSummary(p)),
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

    // GET /agent-api/products/{slug}/availability
    if (route[0] === "products" && route.length === 3 && route[2] === "availability") {
      const key = decodeURIComponent(route[1]);
      const isUuid = /^[0-9a-f-]{36}$/i.test(key);
      const { data: p } = await supabase
        .from("designer_products")
        .select("id, slug, name, lead_time_days, status")
        .eq("status", "approved")
        .eq(isUuid ? "id" : "slug", key)
        .maybeSingle();
      if (!p) return json({ error: "Product not found" }, 404);
      const lead = Number(p.lead_time_days || 21);
      const shippingDaysMin = 3;
      const shippingDaysMax = 7;
      const now = new Date();
      const shipsByMin = new Date(now.getTime() + lead * 86400000);
      const deliversByMin = new Date(shipsByMin.getTime() + shippingDaysMin * 86400000);
      const deliversByMax = new Date(shipsByMin.getTime() + shippingDaysMax * 86400000);
      return json({
        id: p.id,
        slug: p.slug,
        title: p.name,
        availability: "made_to_order",
        in_stock: true,
        lead_time_days: lead,
        shipping_window_days: { min: shippingDaysMin, max: shippingDaysMax },
        estimated_ship_date: shipsByMin.toISOString().slice(0, 10),
        estimated_delivery_window: {
          earliest: deliversByMin.toISOString().slice(0, 10),
          latest: deliversByMax.toISOString().slice(0, 10),
        },
        currency: "INR",
        notes:
          "Made-to-order. Lead time begins after payment confirmation. Shipping is domestic India by default; international quotes on request.",
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

    // GET /agent-api/creators/featured
    if (route[0] === "creators" && route[1] === "featured" && route.length === 2) {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "12", 10), 50);
      // Featured = creators with the most approved products (proxy for activity)
      const { data: profiles } = await supabase
        .from("designer_profiles")
        .select("id, slug, name, design_background, profile_picture_url")
        .eq("status", "approved");
      const { data: products } = await supabase
        .from("designer_products")
        .select("designer_id, category")
        .eq("status", "approved");
      const counts: Record<string, number> = {};
      const cats: Record<string, Set<string>> = {};
      (products || []).forEach((p: any) => {
        counts[p.designer_id] = (counts[p.designer_id] || 0) + 1;
        if (!cats[p.designer_id]) cats[p.designer_id] = new Set();
        if (p.category) cats[p.designer_id].add(p.category);
      });
      const featured = (profiles || [])
        .map((c: any) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          bio: c.design_background,
          avatar: c.profile_picture_url,
          product_count: counts[c.id] || 0,
          categories: Array.from(cats[c.id] || []),
          url: `${SITE_URL}/designer/${c.slug || c.id}`,
        }))
        .filter((c) => c.product_count > 0)
        .sort((a, b) => b.product_count - a.product_count)
        .slice(0, limit);
      return json({ limit, creators: featured });
    }

    // GET /agent-api/creators
    if (route[0] === "creators" && route.length === 1) {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
      const category = url.searchParams.get("category");

      // If category filter, find designer_ids from products in that category
      let designerIdsFilter: string[] | null = null;
      if (category) {
        const { data: prods } = await supabase
          .from("designer_products")
          .select("designer_id")
          .eq("status", "approved")
          .eq("category", category);
        designerIdsFilter = Array.from(new Set((prods || []).map((p: any) => p.designer_id))).filter(Boolean);
        if (designerIdsFilter.length === 0) {
          return json({ limit, offset, category, creators: [] });
        }
      }

      let cQuery = supabase
        .from("designer_profiles")
        .select("id, slug, name, design_background, profile_picture_url")
        .eq("status", "approved");
      if (designerIdsFilter) cQuery = cQuery.in("id", designerIdsFilter);
      const { data, error } = await cQuery
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return json({
        limit,
        offset,
        category: category || null,
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

    // GET /agent-api/orders/{id} (requires user JWT)
    if (route[0] === "orders" && route.length === 2 && req.method === "GET") {
      const orderId = decodeURIComponent(route[1]);
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) {
        return json({ error: "Authentication required. Pass user's JWT as Bearer token." }, 401);
      }
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData?.user) {
        return json({ error: "Invalid or expired token" }, 401);
      }
      const userId = userData.user.id;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select(
          "id, status, total_amount, subtotal, currency:gst_rate, invoice_number, invoice_date, shipping_address, created_at, updated_at, user_id"
        )
        .eq("id", orderId)
        .maybeSingle();
      if (orderErr) throw orderErr;
      if (!order || order.user_id !== userId) {
        return json({ error: "Order not found" }, 404);
      }
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, quantity, price, designer_price, customizations, designer_products(name, slug, lead_time_days, image_url)")
        .eq("order_id", orderId);
      const maxLead = Math.max(0, ...((items || []).map((i: any) => Number(i.designer_products?.lead_time_days || 0))));
      const created = new Date(order.created_at);
      const estShip = new Date(created.getTime() + maxLead * 86400000);
      return json({
        id: order.id,
        status: order.status,
        invoice_number: order.invoice_number,
        invoice_date: order.invoice_date,
        currency: "INR",
        subtotal: order.subtotal ? Number(order.subtotal) : null,
        total: Number(order.total_amount),
        created_at: order.created_at,
        updated_at: order.updated_at,
        estimated_ship_date: maxLead > 0 ? estShip.toISOString().slice(0, 10) : null,
        shipping_address: order.shipping_address,
        items: (items || []).map((i: any) => ({
          product_id: i.product_id,
          title: i.designer_products?.name,
          slug: i.designer_products?.slug,
          image: i.designer_products?.image_url,
          quantity: i.quantity,
          unit_price: Number(i.price),
          line_total: Number(i.price) * Number(i.quantity),
          lead_time_days: i.designer_products?.lead_time_days,
          customizations: i.customizations || {},
          url: `${SITE_URL}/product/${i.designer_products?.slug || i.product_id}`,
        })),
        url: `${SITE_URL}/order-history`,
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
    availability_endpoint: `${AGENT_BASE}/products/${slug}/availability`,
    checkout_intent_example: {
      method: "POST",
      url: `${AGENT_BASE}/checkout-intent`,
      body: { items: [{ slug, quantity: 1 }] },
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Nyzora Agent API",
      version: "1.1.0",
      description:
        "Read-only catalog, search, availability, and checkout-initiation endpoints for AI shopping agents. Currency is INR. Products are made-to-order. Payment is always completed by the human user on nyzora.ai.",
      contact: { email: "contact@nyzora.ai", url: SITE_URL },
    },
    servers: [{ url: AGENT_BASE }],
    paths: {
      "/": { get: { summary: "Service descriptor", responses: { "200": { description: "OK" } } } },
      "/categories": { get: { summary: "List product categories with counts", responses: { "200": { description: "OK" } } } },
      "/search": {
        get: {
          summary: "Search products with structured filters",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "min_price", in: "query", schema: { type: "number" } },
            { name: "max_price", in: "query", schema: { type: "number" } },
            { name: "material", in: "query", schema: { type: "string" } },
            { name: "finish", in: "query", schema: { type: "string" } },
            { name: "max_lead_days", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer", maximum: 200 } },
            { name: "offset", in: "query", schema: { type: "integer" } },
          ],
          responses: { "200": { description: "Matching products" } },
        },
      },
      "/products": {
        get: {
          summary: "List approved products",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "offset", in: "query", schema: { type: "integer" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "q", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/products/{slug}": {
        get: {
          summary: "Product detail by slug or id",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/products/{slug}/availability": {
        get: {
          summary: "Lead time, ship window, and estimated delivery",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/creators": {
        get: {
          summary: "List verified creators (optionally filter by category)",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "offset", in: "query", schema: { type: "integer" } },
            { name: "category", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/creators/featured": {
        get: {
          summary: "Top creators ranked by approved-product count",
          parameters: [{ name: "limit", in: "query", schema: { type: "integer", maximum: 50 } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/creators/{slug}": {
        get: {
          summary: "Creator profile with their products",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/checkout-intent": {
        post: {
          summary: "Create a checkout deep link for the user to complete payment on nyzora.ai",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["items"],
                  properties: {
                    items: {
                      type: "array",
                      maxItems: 20,
                      items: {
                        type: "object",
                        properties: {
                          slug: { type: "string" },
                          id: { type: "string" },
                          quantity: { type: "integer", minimum: 1, maximum: 50 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Checkout intent with deep link" } },
        },
      },
      "/orders/{id}": {
        get: {
          summary: "Order status (requires user JWT in Authorization: Bearer ...)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Order details" },
            "401": { description: "Auth required" },
            "404": { description: "Not found" },
          },
          security: [{ bearerAuth: [] }],
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  };
}