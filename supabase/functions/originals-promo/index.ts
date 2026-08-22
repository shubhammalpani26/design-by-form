import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { isPromoError, resolvePromo } from "../_shared/originalsPromo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Preview-only validation so the buyer sees the discount before paying. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const subtotal = Number(body.subtotalUsd);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return json({ error: "Add a piece to your order first." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const promo = await resolvePromo(admin, body.code, subtotal);
    if (!promo) return json({ error: "Enter a promo code." }, 400);
    if (isPromoError(promo)) return json({ error: promo.error }, 400);

    return json({
      code: promo.code,
      description: promo.description,
      discountUsd: promo.discountUsd,
      totalUsd: Math.round((subtotal - promo.discountUsd) * 100) / 100,
    });
  } catch (e) {
    console.error("originals-promo error", e);
    return json({ error: "We couldn't check that code. Try again." }, 500);
  }
});
