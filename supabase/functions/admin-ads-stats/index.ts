import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { attributeSessions, campaignLabel, NOT_FROM_AD } from "../_shared/adCampaigns.ts";
import {
  act, bands, biggestDrop, buildAlerts, checkoutsOf, istWindow, landedOf, purchasesOf, type Step,
} from "../_shared/adsReport.ts";

/**
 * Admin-only, read-only snapshot for the "Ads" tab: everything about the
 * Facebook/Instagram ads in one refresh — account money left, each ad's
 * results, who saw them, day by day, tracking health, and what ad visitors
 * did on the site (photo → preview → size → checkout → payment).
 * Meta reads go through the linked Meta Ads connection. Nothing is changed.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const AD_ACCOUNT = "act_2036145687783794";
const PIXEL_ID = "2121773078407819";
const META_GATEWAY = "https://connector-gateway.lovable.dev/meta_ads/v26.0";
const REAL_PROVIDERS = ["razorpay", "cashfree"];
const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$" };

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
    const win = istWindow(days);
    const timeRange = encodeURIComponent(JSON.stringify({ since: win.since, until: win.until }));

    // ---------- Meta reads (each one may fail on its own) ----------
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const metaKey = Deno.env.get("META_ADS_API_KEY");
    const errors: string[] = [];
    const g = async (label: string, path: string): Promise<any> => {
      if (!lovableKey || !metaKey) { errors.push("Meta Ads connection is not linked"); return null; }
      try {
        const r = await fetch(`${META_GATEWAY}${path}`, {
          headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": metaKey },
        });
        const text = await r.text();
        let j: any = null;
        try { j = JSON.parse(text); } catch { /* non-JSON */ }
        if (!r.ok || j?.error) {
          console.error(`Meta ${label} [${r.status}]: ${text.slice(0, 400)}`);
          errors.push(`${label}: ${j?.error?.error_user_msg ?? j?.error?.message ?? `failed (${r.status})`}`);
          return null;
        }
        return j;
      } catch (e) {
        errors.push(`${label}: ${(e as Error).message}`);
        return null;
      }
    };
    const insightFields = "spend,impressions,reach,inline_link_clicks,actions";
    const [acct, camps, adList, byAd, daily, byAge, byRegion, pixel] = await Promise.all([
      g("Account", `/${AD_ACCOUNT}?fields=currency,account_status,balance,amount_spent,spend_cap,funding_source_details`),
      g("Campaigns", `/${AD_ACCOUNT}/campaigns?fields=id,name,effective_status,daily_budget,adsets.limit(20){daily_budget,effective_status}&limit=50`),
      g("Ads", `/${AD_ACCOUNT}/ads?fields=id,name,effective_status,campaign_id,issues_info,ad_review_feedback&limit=100&effective_status=${encodeURIComponent('["ACTIVE","PAUSED","ADSET_PAUSED","CAMPAIGN_PAUSED","DISAPPROVED","WITH_ISSUES","PENDING_REVIEW","IN_PROCESS"]')}`),
      g("Ad results", `/${AD_ACCOUNT}/insights?level=ad&time_range=${timeRange}&fields=ad_id,ad_name,campaign_id,campaign_name,${insightFields},video_thruplay_watched_actions&limit=100`),
      g("Daily", `/${AD_ACCOUNT}/insights?time_increment=1&time_range=${timeRange}&fields=${insightFields}&limit=100`),
      g("Ages", `/${AD_ACCOUNT}/insights?breakdowns=age,gender&time_range=${timeRange}&fields=spend,inline_link_clicks,actions&limit=100`),
      g("States", `/${AD_ACCOUNT}/insights?breakdowns=region&time_range=${timeRange}&fields=spend,inline_link_clicks,actions&limit=100`),
      g("Tracking", `/${PIXEL_ID}/stats?aggregation=event`),
    ]);

    const currency = acct?.currency ?? "INR";
    const sym = SYMBOLS[currency] ?? `${currency} `;

    // Account money
    const campRows = camps?.data ?? [];
    const activeCamps = campRows.filter((c: any) => c.effective_status === "ACTIVE");
    const dailyBudget = activeCamps.reduce((s: number, c: any) => {
      if (c.daily_budget) return s + Number(c.daily_budget) / 100;
      const sets = (c.adsets?.data ?? []).filter((a: any) => a.effective_status === "ACTIVE");
      return s + sets.reduce((t: number, a: any) => t + Number(a.daily_budget ?? 0) / 100, 0);
    }, 0);
    const capLeft = acct?.spend_cap && Number(acct.spend_cap) > 0
      ? (Number(acct.spend_cap) - Number(acct.amount_spent ?? 0)) / 100 : null;
    const prepaidMatch = String(acct?.funding_source_details?.display_string ?? "").match(/Available Balance \(\D*([\d,]+(?:\.\d+)?)/i);
    const prepaid = prepaidMatch ? Number(prepaidMatch[1].replace(/,/g, "")) : null;
    const campaignName = new Map<string, string>(campRows.map((c: any) => [c.id, c.name]));

    // Each ad: live status + results in the window
    const results = new Map<string, any>((byAd?.data ?? []).map((r: any) => [r.ad_id, r]));
    const listed = (adList?.data ?? []) as any[];
    const ids = new Set<string>([...listed.filter((a) => a.effective_status === "ACTIVE").map((a) => a.id), ...results.keys()]);
    const listedById = new Map(listed.map((a) => [a.id, a]));
    const ads = [...ids].map((id) => {
      const l = listedById.get(id) ?? {};
      const r = results.get(id) ?? {};
      const impressions = Number(r.impressions ?? 0);
      const linkClicks = Number(r.inline_link_clicks ?? 0);
      const spend = Number(r.spend ?? 0);
      const thruplays = act(r.video_thruplay_watched_actions, "video_view");
      const review = l.ad_review_feedback?.global ? Object.values(l.ad_review_feedback.global).join(" ") : "";
      const issue = (l.issues_info ?? [])[0]?.error_message ?? "";
      return {
        id,
        name: l.name ?? r.ad_name ?? id,
        campaign: campaignName.get(l.campaign_id ?? r.campaign_id) ?? r.campaign_name ?? "",
        status: l.effective_status ?? "UNKNOWN",
        active: l.effective_status === "ACTIVE",
        spend, impressions, reach: Number(r.reach ?? 0), linkClicks,
        ctr: impressions ? (linkClicks / impressions) * 100 : 0,
        cpc: linkClicks ? spend / linkClicks : null,
        landed: landedOf(r.actions),
        checkouts: checkoutsOf(r.actions),
        purchases: purchasesOf(r.actions),
        fullWatchRate: impressions && thruplays ? (thruplays / impressions) * 100 : null,
        problem: review || issue || (l.effective_status === "DISAPPROVED" ? "Rejected by Meta" : ""),
      };
    }).sort((a, b) => Number(b.active) - Number(a.active) || b.spend - a.spend);

    const totals = ads.reduce((s, a) => ({
      spend: s.spend + a.spend, impressions: s.impressions + a.impressions, reach: s.reach + a.reach,
      linkClicks: s.linkClicks + a.linkClicks, landed: s.landed + a.landed,
      checkouts: s.checkouts + a.checkouts, purchases: s.purchases + a.purchases,
    }), { spend: 0, impressions: 0, reach: 0, linkClicks: 0, landed: 0, checkouts: 0, purchases: 0 });

    // Who saw the ads
    const ageRows = (byAge?.data ?? []).map((r: any) => ({
      age: String(r.age), gender: String(r.gender), spend: Number(r.spend ?? 0),
      clicks: Number(r.inline_link_clicks ?? 0), checkouts: checkoutsOf(r.actions), purchases: purchasesOf(r.actions),
    }));
    const ageBands = bands(ageRows.map((r: any) => ({ key: r.age, ...r }))).sort((a, b) => a.key.localeCompare(b.key));
    const genderBands = bands(ageRows.map((r: any) => ({ key: r.gender, ...r }))).sort((a, b) => b.spend - a.spend);
    const stateBands = bands((byRegion?.data ?? []).map((r: any) => ({
      key: String(r.region), spend: Number(r.spend ?? 0), clicks: Number(r.inline_link_clicks ?? 0),
      checkouts: checkoutsOf(r.actions), purchases: purchasesOf(r.actions),
    }))).sort((a, b) => b.spend - a.spend);

    const dailyRows = (daily?.data ?? []).map((r: any) => ({
      date: r.date_start, spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0),
      linkClicks: Number(r.inline_link_clicks ?? 0), landed: landedOf(r.actions),
      checkouts: checkoutsOf(r.actions), purchases: purchasesOf(r.actions),
    }));

    // Tracking health: events Meta received from the site in the last ~24h
    let tracking: Record<string, number> | null = null;
    if (pixel?.data) {
      tracking = {};
      for (const bucket of pixel.data) for (const e of bucket.data ?? []) tracking[e.value] = (tracking[e.value] ?? 0) + Number(e.count ?? 0);
    }

    // ---------- What ad visitors did on the site ----------
    const events: { experiment: string; event: string; session_id: string; metadata: any; created_at: string }[] = [];
    for (let from = 0; from < 30000; from += 1000) {
      const { data, error } = await admin
        .from("experiment_events")
        .select("experiment, event, session_id, metadata, created_at")
        .gte("created_at", win.sinceUtc)
        .in("experiment", ["site", "render_progress", "reveal_screen"])
        .order("created_at", { ascending: true })
        .range(from, from + 999);
      if (error) throw error;
      events.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const pageViews = events.filter((e) => e.experiment === "site" && e.event === "page_view");
    const sessionCampaign = attributeSessions(pageViews);
    const adSessions = new Set([...sessionCampaign.entries()].filter(([, c]) => c !== NOT_FROM_AD).map(([s]) => s));
    const people = (exp: string, ev: string) =>
      new Set(events.filter((e) => e.experiment === exp && e.event === ev && adSessions.has(e.session_id)).map((e) => e.session_id)).size;
    const site = {
      visitors: adSessions.size,
      opened: people("render_progress", "flow_view"),
      photo: people("render_progress", "photo_selected"),
      preview: people("reveal_screen", "reveal_view"),
      size: people("reveal_screen", "size_select"),
      checkout: people("reveal_screen", "checkout_click"),
      payment: people("reveal_screen", "payment_reached"),
    };
    const byCampaign = new Map<string, number>();
    for (const s of adSessions) {
      const c = sessionCampaign.get(s)!;
      byCampaign.set(c, (byCampaign.get(c) ?? 0) + 1);
    }

    // Paid orders in the window (real payments; tests, unpaid and refunded excluded)
    const { data: orderRows } = await admin
      .from("originals_orders")
      .select("id, status, amount_usd, discount_usd, size_label, created_at")
      .gte("created_at", win.sinceUtc)
      .in("payment_provider", REAL_PROVIDERS)
      .order("created_at", { ascending: false })
      .limit(200);
    const paid = (orderRows ?? []).filter((o) => !["pending", "failed", "cancelled", "refunded"].includes(String(o.status)));
    const revenueUsd = paid.reduce((s, o) => s + Number(o.amount_usd ?? 0) - Number(o.discount_usd ?? 0), 0);

    const { data: rate } = await admin
      .from("currency_rates").select("rate, last_updated")
      .eq("base_currency", "INR").eq("target_currency", "USD").maybeSingle();
    const usdPerUnit = currency === "USD" ? 1 : currency === "INR" && rate?.rate ? Number(rate.rate) : null;

    // Funnel: ads (Meta's counts) then the site (our counts for ad visitors)
    const funnel: (Step & { source: "meta" | "site" })[] = [
      { label: "Saw an ad", people: totals.reach, source: "meta" },
      { label: "Tapped to the site", people: totals.linkClicks, source: "meta" },
      { label: "Page loaded", people: totals.landed, source: "meta" },
      { label: "Picked a photo", people: site.photo, source: "site" },
      { label: "Saw their preview", people: site.preview, source: "site" },
      { label: "Tapped a size", people: site.size, source: "site" },
      { label: "Clicked checkout", people: site.checkout, source: "site" },
      { label: "Reached payment", people: site.payment, source: "site" },
      { label: "Paid", people: totals.purchases, source: "meta" },
    ];
    // Drop-off is judged from "page loaded" onward, where people act on the site.
    const drop = biggestDrop(funnel.slice(2));

    const alerts = buildAlerts({
      currencySymbol: sym,
      accountActive: acct ? Number(acct.account_status) === 1 : true,
      activeAds: ads.filter((a) => a.active).length,
      dailyBudget, capLeft, prepaid,
      adIssues: ads.filter((a) => a.active && a.problem).map((a) => ({ name: a.name, reason: a.problem })),
      pixelPageViews24h: tracking ? tracking.PageView ?? 0 : null,
      spend: totals.spend, metaPurchases: totals.purchases, paidOrders: paid.length,
      adPreviews: site.preview, adCheckouts: site.checkout, adPayments: site.payment,
      drop, ageBands, stateBands,
      ads: ads.map((a) => ({ name: a.name, active: a.active, impressions: a.impressions, linkClicks: a.linkClicks })),
    });

    return json({
      generatedAt: new Date().toISOString(),
      days, window: { since: win.since, until: win.until, timezone: "India time" },
      currency, symbol: sym,
      account: {
        active: acct ? Number(acct.account_status) === 1 : null,
        activeCampaigns: activeCamps.map((c: any) => c.name),
        activeAds: ads.filter((a) => a.active).length,
        dailyBudget, capLeft, prepaid,
        daysLeft: capLeft != null && dailyBudget > 0 ? capLeft / dailyBudget : null,
      },
      totals: {
        ...totals,
        ctr: totals.impressions ? (totals.linkClicks / totals.impressions) * 100 : 0,
        cpc: totals.linkClicks ? totals.spend / totals.linkClicks : null,
        costPerPreview: site.preview ? totals.spend / site.preview : null,
        costPerSale: totals.purchases ? totals.spend / totals.purchases : null,
      },
      money: {
        paidOrders: paid.length, revenueUsd,
        spendUsd: usdPerUnit != null ? totals.spend * usdPerUnit : null,
        rateDate: rate?.last_updated ?? null,
        orders: paid.slice(0, 10).map((o) => ({ created_at: o.created_at, size: o.size_label, usd: Number(o.amount_usd ?? 0) - Number(o.discount_usd ?? 0) })),
      },
      funnel, drop, site,
      campaigns: [...byCampaign.entries()].map(([k, n]) => ({ label: campaignLabel(k), visitors: n })).sort((a, b) => b.visitors - a.visitors),
      ads, ageBands, genderBands, stateBands: stateBands.slice(0, 8), daily: dailyRows,
      tracking, alerts, errors,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
