import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Admin-only snapshot for the "Dashboard" tab: visitors, top pages, preview
 * funnel, renders, real paid orders and Meta ad performance for a window.
 * Every number is computed live from stored records, so a refresh is always
 * the current truth.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const AD_ACCOUNT = "act_2036145687783794";
const CAMPAIGN_ID = "120249343361350499";
const REAL_PROVIDERS = ["razorpay", "cashfree"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const days = [1, 7, 30].includes(Number(body.days)) ? Number(body.days) : 7;
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    // --- Events (paged, up to 20k) ---
    const events: { experiment: string; event: string; session_id: string; metadata: any; created_at: string }[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await admin
        .from("experiment_events")
        .select("experiment, event, session_id, metadata, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .range(from, from + 999);
      if (error) throw error;
      events.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }

    const allSessions = new Set<string>();
    const pageViews = events.filter((e) => e.experiment === "site" && e.event === "page_view");
    const pages = new Map<string, { views: number; visitors: Set<string> }>();
    const sources = new Map<string, Set<string>>();
    const daily = new Map<string, Set<string>>();
    for (const e of events) {
      allSessions.add(e.session_id);
      const d = e.created_at.slice(0, 10);
      if (!daily.has(d)) daily.set(d, new Set());
      daily.get(d)!.add(e.session_id);
    }
    for (const e of pageViews) {
      const p = String(e.metadata?.path ?? "/");
      if (!pages.has(p)) pages.set(p, { views: 0, visitors: new Set() });
      const r = pages.get(p)!;
      r.views++;
      r.visitors.add(e.session_id);
      const src = String(e.metadata?.source ?? "direct");
      if (!sources.has(src)) sources.set(src, new Set());
      sources.get(src)!.add(e.session_id);
    }

    const uniq = (exp: string, ev: string) =>
      new Set(events.filter((e) => e.experiment === exp && e.event === ev).map((e) => e.session_id)).size;
    const count = (exp: string, ev: string) => events.filter((e) => e.experiment === exp && e.event === ev).length;

    const funnel = [
      { label: "Opened a pet page", people: uniq("render_progress", "flow_view") },
      { label: "Picked a photo", people: uniq("render_progress", "photo_selected") },
      { label: "Saw their preview", people: uniq("reveal_screen", "reveal_view") },
      { label: "Tapped a size", people: uniq("reveal_screen", "size_select") },
      { label: "Clicked checkout", people: uniq("reveal_screen", "checkout_click") },
      { label: "Reached payment", people: uniq("reveal_screen", "payment_reached") },
    ];

    // --- Renders ---
    const { count: renders } = await admin
      .from("originals_previews")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .not("preview_image_url", "is", null);

    // --- Orders (real payments only; tests excluded) ---
    const { data: orders } = await admin
      .from("originals_orders")
      .select("id, status, production_status, amount_usd, discount_usd, quantity, sku_slug, size_label, created_at, payment_provider")
      .gte("created_at", since)
      .in("payment_provider", REAL_PROVIDERS)
      .order("created_at", { ascending: false })
      .limit(200);
    const paid = (orders ?? []).filter((o) => o.status !== "pending" && o.status !== "failed" && o.status !== "cancelled");
    const revenue = paid.reduce((s, o) => s + Number(o.amount_usd ?? 0) - Number(o.discount_usd ?? 0), 0);

    // --- Meta ads ---
    let ads: any = null;
    try {
      const { data: tokenRow } = await admin
        .from("user_connector_tokens").select("meta_defaults").eq("user_id", u.user.id).maybeSingle();
      const stored = (tokenRow?.meta_defaults as any)?.meta_token;
      const valid = stored?.access_token && (!stored.expires_at || new Date(stored.expires_at).getTime() > Date.now());
      const token = valid ? stored.access_token : Deno.env.get("META_ACCESS_TOKEN");
      if (!token) throw new Error("No Meta access token");
      const preset = days === 1 ? "today" : days === 7 ? "last_7d" : "last_30d";
      const g = async (path: string) => {
        const r = await fetch(`https://graph.facebook.com/v21.0${path}${path.includes("?") ? "&" : "?"}access_token=${token}`);
        const j = await r.json();
        if (j.error) throw new Error(j.error.message);
        return j;
      };
      const fields = "ad_name,spend,impressions,clicks,ctr,cpc,actions";
      const [acct, byAd, camp] = await Promise.all([
        g(`/${AD_ACCOUNT}?fields=currency,balance,amount_spent,spend_cap,account_status,funding_source_details`),
        g(`/${AD_ACCOUNT}/insights?level=ad&date_preset=${preset}&fields=${fields}&limit=50`),
        g(`/${CAMPAIGN_ID}?fields=effective_status,daily_budget,adsets{daily_budget,effective_status}`),
      ]);
      const act = (a: any[] | undefined, t: string) =>
        Number((a ?? []).find((x) => x.action_type === t)?.value ?? 0);
      const rows = (byAd.data ?? []).map((r: any) => ({
        name: r.ad_name,
        spend: Number(r.spend ?? 0),
        impressions: Number(r.impressions ?? 0),
        clicks: Number(r.clicks ?? 0),
        ctr: Number(r.ctr ?? 0),
        cpc: Number(r.cpc ?? 0),
        landings: act(r.actions, "landing_page_view"),
        purchases: act(r.actions, "offsite_conversion.fb_pixel_purchase") || act(r.actions, "purchase"),
      }));
      const tot = rows.reduce(
        (s: any, r: any) => ({
          spend: s.spend + r.spend, impressions: s.impressions + r.impressions,
          clicks: s.clicks + r.clicks, landings: s.landings + r.landings, purchases: s.purchases + r.purchases,
        }),
        { spend: 0, impressions: 0, clicks: 0, landings: 0, purchases: 0 },
      );
      const adsetBudget = camp.adsets?.data?.[0]?.daily_budget ?? camp.daily_budget;
      ads = {
        currency: acct.currency,
        // Meta reports balance/amount_spent/budget in the smallest currency unit.
        balance: Number(acct.balance ?? 0) / 100,
        fundsText: acct.funding_source_details?.display_string ?? null,
        spendCapLeft: acct.spend_cap ? (Number(acct.spend_cap) - Number(acct.amount_spent)) / 100 : null,
        campaignStatus: camp.effective_status,
        dailyBudget: adsetBudget ? Number(adsetBudget) / 100 : null,
        totals: { ...tot, ctr: tot.impressions ? (tot.clicks / tot.impressions) * 100 : 0, cpc: tot.clicks ? tot.spend / tot.clicks : 0 },
        rows,
      };
    } catch (e) {
      ads = { error: (e as Error).message };
    }

    return json({
      generatedAt: new Date().toISOString(),
      days,
      visitors: allSessions.size,
      pageViews: pageViews.length,
      pageTrackingSince: pageViews[0]?.created_at ?? null,
      daily: [...daily.entries()].sort().map(([date, s]) => ({ date, visitors: s.size })),
      topPages: [...pages.entries()]
        .map(([path, r]) => ({ path, views: r.views, visitors: r.visitors.size }))
        .sort((a, b) => b.visitors - a.visitors).slice(0, 15),
      sources: [...sources.entries()].map(([source, s]) => ({ source, visitors: s.size })).sort((a, b) => b.visitors - a.visitors),
      funnel,
      previewAttempts: count("render_progress", "generate_start"),
      previewFailures: count("render_progress", "generate_error"),
      renders: renders ?? 0,
      orders: { count: paid.length, revenue, list: paid.slice(0, 20) },
      ads,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
