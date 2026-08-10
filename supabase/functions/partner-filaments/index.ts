import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getFilaments, type PartnerFilament } from "../_shared/slant3d.ts";

const CONFIG_KEY = "us_partner_filaments";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function getCachedCatalog(): Promise<PartnerFilament[] | null> {
  const { data } = await admin
    .from("pricing_config")
    .select("config_value, updated_at")
    .eq("config_key", CONFIG_KEY)
    .maybeSingle();

  if (!data) return null;
  const updatedAt = data.updated_at ? new Date(data.updated_at).getTime() : 0;
  const stale = Date.now() - updatedAt > CACHE_TTL_MS;
  if (stale) return null;

  const value = data.config_value;
  if (Array.isArray(value?.filaments)) return value.filaments;
  if (Array.isArray(value)) return value;
  return null;
}

async function setCachedCatalog(filaments: PartnerFilament[]) {
  const { data: existing } = await admin
    .from("pricing_config")
    .select("id")
    .eq("config_key", CONFIG_KEY)
    .maybeSingle();

  const payload = { filaments };
  if (existing?.id) {
    await admin
      .from("pricing_config")
      .update({ config_value: payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin
      .from("pricing_config")
      .insert({ config_key: CONFIG_KEY, config_value: payload });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Allow public reads; only admins can force a refresh.
    const forceRefresh = body?.refresh === true;
    if (forceRefresh) {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data } = await admin.auth.getUser(token);
      if (!data?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await admin.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let catalog = forceRefresh ? null : await getCachedCatalog();
    if (!catalog) {
      try {
        catalog = await getFilaments();
        await setCachedCatalog(catalog);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("partner-filaments fetch failed, using fallback:", message);
        // Fallback palette so product pages still render color swatches even if the
        // partner API is temporarily unavailable.
        catalog = [
          { filament: "PLA BLACK", hexColor: "#2D2D2D", colorTag: "black", profile: "PLA", filamentId: "" },
          { filament: "PLA WHITE", hexColor: "#F5F5F0", colorTag: "white", profile: "PLA", filamentId: "" },
          { filament: "PLA RED", hexColor: "#C0392B", colorTag: "red", profile: "PLA", filamentId: "" },
          { filament: "PLA BLUE", hexColor: "#2980B9", colorTag: "blue", profile: "PLA", filamentId: "" },
          { filament: "PLA GREEN", hexColor: "#27AE60", colorTag: "green", profile: "PLA", filamentId: "" },
          { filament: "PLA SILVER", hexColor: "#BDC3C7", colorTag: "silver", profile: "PLA", filamentId: "" },
        ];
      }
    }

    return new Response(JSON.stringify({ filaments: catalog }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("partner-filaments error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


