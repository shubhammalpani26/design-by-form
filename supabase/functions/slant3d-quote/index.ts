import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isPrintableFileUrl,
  partnerCostToMbpUsd,
  PartnerApiError,
  sliceModel,
  US_PARTNER_MARKUP,
} from "../_shared/slant3d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const FALLBACK_USD_INR = 88;

async function usdToInrRate(): Promise<number> {
  const { data } = await admin
    .from("currency_rates")
    .select("rate")
    .eq("base_currency", "USD")
    .eq("target_currency", "INR")
    .maybeSingle();
  const rate = Number(data?.rate);
  return Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_USD_INR;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const productId = typeof body?.product_id === "string" ? body.product_id : null;
    let fileUrl = typeof body?.file_url === "string" ? body.file_url : null;

    let product: {
      id: string;
      designer_id: string;
      print_file_url: string | null;
      model_url: string | null;
      manufacturing_method: string;
      base_price: number | null;
      designer_price: number | null;
    } | null = null;

    if (productId) {
      const { data, error } = await admin
        .from("designer_products")
        .select(
          "id, designer_id, print_file_url, model_url, manufacturing_method, base_price, designer_price",
        )
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Product not found" }, 404);
      product = data;
      fileUrl = fileUrl ?? data.print_file_url ?? data.model_url;
    }

    if (!fileUrl) {
      return json({ error: "No printable file available for this design" }, 400);
    }
    if (!/^https:\/\//i.test(fileUrl)) {
      return json({ error: "File URL must be a public https URL" }, 400);
    }
    if (!isPrintableFileUrl(fileUrl)) {
      return json(
        {
          error:
            "Slant 3D needs an .stl, .3mf or .obj file. Upload a print-ready mesh for this design first.",
        },
        400,
      );
    }

    let partnerCost: number;
    try {
      partnerCost = await sliceModel(fileUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (product) {
        await admin
          .from("designer_products")
          .update({ slant3d_quote_error: message.slice(0, 500), slant3d_quoted_at: new Date().toISOString() })
          .eq("id", product.id);
      }
      return json({ error: message }, e instanceof PartnerApiError ? e.status : 502);
    }

    // Nyzora's manufacturing base price carries a 25% margin over partner cost.
    const mbpUsd = partnerCostToMbpUsd(partnerCost);
    const rate = await usdToInrRate();
    const mbpInr = Math.round(mbpUsd * rate);

    if (product) {
      // Persist only for the owning creator or an admin.
      const [{ data: profile }, { data: isAdmin }] = await Promise.all([
        admin.from("designer_profiles").select("id").eq("id", product.designer_id).eq("user_id", user.id).maybeSingle(),
        admin.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (profile || isAdmin === true) {
        // Preserve the creator's markup percentage when the MBP moves.
        const oldBase = Number(product.base_price) || 0;
        const oldSelling = Number(product.designer_price) || 0;
        const markupRatio = oldBase > 0 && oldSelling > 0 ? oldSelling / oldBase : 1.35;
        const newSelling = Math.max(mbpInr, Math.round(mbpInr * markupRatio));

        await admin
          .from("designer_products")
          .update({
            slant3d_price_usd: partnerCost,
            slant3d_quoted_at: new Date().toISOString(),
            slant3d_quote_error: null,
            print_file_url: fileUrl,
            base_price: mbpInr,
            designer_price: newSelling,
            pricing_calculated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (oldBase > 0 && oldBase !== mbpInr) {
          await admin.from("product_pricing_history").insert({
            product_id: product.id,
            old_price: oldSelling || oldBase,
            new_price: newSelling,
            reason: "us_manufacturing_quote",
            changed_by: user.id,
          });
        }
      }
    }

    return json({
      mbp_usd: mbpUsd,
      mbp_inr: mbpInr,
      markup_applied: US_PARTNER_MARKUP,
      file_url: fileUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("slant3d-quote error:", message);
    return json({ error: message }, e instanceof PartnerApiError ? e.status : 500);
  }
});