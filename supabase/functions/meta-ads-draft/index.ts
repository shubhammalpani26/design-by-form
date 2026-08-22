import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API = "https://graph.facebook.com/v21.0";
const MAX_DAILY_BUDGET_USD = 200;

async function graph<T = any>(
  path: string,
  token: string,
  form?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: form ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta ${res.status} ${path}: ${text.slice(0, 800)}`);
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    return { raw: text } as T;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    // Prefer the live long-lived token stored by the Meta connector flow; fall back to the env token.
    const { data: tokenRow } = await admin
      .from("user_connector_tokens")
      .select("meta_defaults")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const stored = (tokenRow?.meta_defaults as any)?.meta_token as
      | { access_token?: string; expires_at?: string }
      | undefined;
    const storedValid =
      stored?.access_token && (!stored.expires_at || new Date(stored.expires_at).getTime() > Date.now());
    const token = storedValid ? stored!.access_token! : Deno.env.get("META_ACCESS_TOKEN");
    if (!token) return json({ error: "No usable Meta access token" }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "inspect";

    // --- Discovery: what assets does this token see? ---
    if (action === "inspect") {
      const [accounts, pages] = await Promise.all([
        graph(`/me/adaccounts?fields=id,account_id,name,currency,account_status&limit=25`, token).catch(
          (e) => ({ error: String(e) }),
        ),
        graph(`/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=25`, token).catch(
          (e) => ({ error: String(e) }),
        ),
      ]);
      let pixels: unknown = null;
      const firstAct = body.ad_account_id
        ? (String(body.ad_account_id).startsWith("act_") ? body.ad_account_id : `act_${body.ad_account_id}`)
        : (accounts as any)?.data?.[0]?.id;
      if (firstAct) {
        pixels = await graph(`/${firstAct}/adspixels?fields=id,name,last_fired_time`, token).catch((e) => ({
          error: String(e),
        }));
      }
      return json({ accounts, pages, pixels });
    }

    // --- Raw read-only graph probe (GET only) ---
    if (action === "get") {
      const path = String(body.path ?? "");
      if (!path.startsWith("/")) return json({ error: "path must start with /" }, 400);
      return json(await graph(path, token));
    }

    // --- Delete a draft object (only ever used to clean up failed drafts) ---
    if (action === "delete") {
      const id = String(body.object_id ?? "");
      if (!/^\d+$/.test(id)) return json({ error: "object_id must be numeric" }, 400);
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return json({ id, status: res.status, body: await res.text() });
    }

    // --- Assign a pixel to an ad account (required before audience creation) ---
    if (action === "share_pixel") {
      const { pixel_id, ad_account_id, business_id } = body as {
        pixel_id: string;
        ad_account_id: string;
        business_id: string;
      };
      const numericAct = String(ad_account_id).replace("act_", "");
      const res = await graph(`/${pixel_id}/shared_accounts`, token, {
        account_id: numericAct,
        business: String(business_id),
      }).catch((e) => ({ error: String(e) }));
      const check = await graph(`/act_${numericAct}/adspixels?fields=id,name`, token).catch((e) => ({
        error: String(e),
      }));
      return json({ share: res, pixels_on_account: check });
    }


    // --- Interest lookup ---
    if (action === "interests") {
      const q = encodeURIComponent(String(body.q ?? "pet"));
      const res = await graph(
        `/search?type=adinterest&q=${q}&limit=15&fields=id,name,audience_size_lower_bound,audience_size_upper_bound,topic`,
        token,
      );
      return json(res);
    }

    // --- Draft: campaign + ad set, PAUSED, no ads/creative yet ---
    if (action === "draft") {
      const {
        ad_account_id,
        pixel_id,
        campaigns = [],
      } = body as {
        ad_account_id: string;
        pixel_id: string;
        campaigns: Array<{
          name: string;
          objective: string;
          daily_budget_usd: number;
          optimize_for: string;
          countries: string[];
          age_min: number;
          age_max: number;
          locales?: number[];
          interest_ids?: string[];
          custom_audience_ids?: string[];
          excluded_custom_audience_ids?: string[];
        }>;
      };
      if (!ad_account_id || !pixel_id) return json({ error: "ad_account_id and pixel_id required" }, 400);
      const act = ad_account_id.startsWith("act_") ? ad_account_id : `act_${ad_account_id}`;

      // Meta budgets are in the ad account's own currency (minor units).
      const acct = await graph<{ currency?: string }>(`/${act}?fields=currency`, token);
      const currency = acct?.currency ?? "USD";
      const FX: Record<string, number> = { USD: 1, INR: 87.5, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.52 };
      const rate = FX[currency] ?? 1;
      const minorUnits = (usd: number) => String(Math.round(usd * rate * 100));

      const created: unknown[] = [];
      for (const c of campaigns) {
        if (!(c.daily_budget_usd > 0) || c.daily_budget_usd > MAX_DAILY_BUDGET_USD) {
          return json({ error: `Invalid daily budget for ${c.name}` }, 400);
        }
        const campaign = await graph<{ id: string }>(`/${act}/campaigns`, token, {
          name: c.name,
          objective: c.objective,
          status: "PAUSED",
          special_ad_categories: "[]",
          is_adset_budget_sharing_enabled: "false",
        });

        const targeting: Record<string, unknown> = {
          geo_locations: { countries: c.countries },
          age_min: c.age_min,
          age_max: c.age_max,
          // Interest targeting stays as specified; Advantage+ expansion off so learnings stay readable.
          targeting_automation: { advantage_audience: 0 },
        };
        if (c.interest_ids?.length) {
          targeting.flexible_spec = [{ interests: c.interest_ids.map((id) => ({ id })) }];
        }
        if (c.locales?.length) targeting.locales = c.locales;
        if (c.custom_audience_ids?.length) {
          targeting.custom_audiences = c.custom_audience_ids.map((id) => ({ id }));
        }
        if (c.excluded_custom_audience_ids?.length) {
          targeting.excluded_custom_audiences = c.excluded_custom_audience_ids.map((id) => ({ id }));
        }

        const adset = await graph<{ id: string }>(`/${act}/adsets`, token, {
          name: `${c.name} — Ad set`,
          campaign_id: campaign.id,
          daily_budget: minorUnits(c.daily_budget_usd),
          billing_event: "IMPRESSIONS",
          optimization_goal: "OFFSITE_CONVERSIONS",
          bid_strategy: "LOWEST_COST_WITHOUT_CAP",
          promoted_object: JSON.stringify({ pixel_id, custom_event_type: c.optimize_for }),
          targeting: JSON.stringify(targeting),
          status: "PAUSED",
        });

        created.push({
          name: c.name,
          campaign_id: campaign.id,
          adset_id: adset.id,
          daily_budget_usd: c.daily_budget_usd,
          daily_budget_account_currency: `${currency} ${(c.daily_budget_usd * rate).toFixed(0)}`,
          status: "PAUSED",
        });
      }
      return json({ ad_account_id: act, currency, created, note: "Creative/ads intentionally not created yet." });
    }

    // --- Audiences: pixel-based custom audiences for retargeting ---
    if (action === "audiences") {
      const { ad_account_id, pixel_id } = body as { ad_account_id: string; pixel_id: string };
      const act = ad_account_id.startsWith("act_") ? ad_account_id : `act_${ad_account_id}`;

      // Meta budgets are in the ad account's own currency (minor units).
      const acct = await graph<{ currency?: string }>(`/${act}?fields=currency`, token);
      const currency = acct?.currency ?? "USD";
      const FX: Record<string, number> = { USD: 1, INR: 87.5, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.52 };
      const rate = FX[currency] ?? 1;
      const minorUnits = (usd: number) => String(Math.round(usd * rate * 100));
      const make = (name: string, event: string, days: number) =>
        graph<{ id: string }>(`/${act}/customaudiences`, token, {
          name,
          retention_days: String(days),
          prefill: "1",
          rule: JSON.stringify({
            inclusions: {
              operator: "or",
              rules: [{ event_sources: [{ type: "pixel", id: pixel_id }], retention_seconds: days * 86400, filter: { operator: "and", filters: [{ field: "event", operator: "eq", value: event }] } }],
            },
          }),
        });
      const out: Record<string, unknown> = {};
      for (const [key, name, event, days] of [
        ["customizers_30d", "Nyzora — Customized preview (30d)", "CustomizeProduct", 30],
        ["checkout_30d", "Nyzora — Initiated checkout (30d)", "InitiateCheckout", 30],
        ["purchasers_180d", "Nyzora — Purchasers (180d)", "Purchase", 180],
      ] as Array<[string, string, string, number]>) {
        out[key] = await make(name, event, days).catch((e) => ({ error: String(e) }));
      }
      return json(out);
    }

    // --- Attach custom audiences to an existing (paused) ad set ---
    if (action === "attach_audiences") {
      const { adset_id, include = [], exclude = [] } = body as {
        adset_id: string;
        include?: string[];
        exclude?: string[];
      };
      if (!/^\d+$/.test(String(adset_id))) return json({ error: "adset_id must be numeric" }, 400);
      const current = await graph<{ targeting: Record<string, unknown>; status: string }>(
        `/${adset_id}?fields=targeting,status`,
        token,
      );
      if (current.status !== "PAUSED") return json({ error: "Ad set must be PAUSED" }, 400);
      const targeting = { ...(current.targeting ?? {}) };
      if (include.length) targeting.custom_audiences = include.map((id) => ({ id }));
      if (exclude.length) targeting.excluded_custom_audiences = exclude.map((id) => ({ id }));
      const res = await graph(`/${adset_id}`, token, { targeting: JSON.stringify(targeting) });
      const after = await graph(`/${adset_id}?fields=name,status,targeting`, token);
      return json({ res, after });
    }

    return json({ error: `Unknown action ${action}` }, 400);

  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
