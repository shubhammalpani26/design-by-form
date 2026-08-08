import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ensurePrintFile } from "../_shared/printFile.ts";

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
    let modelUrl = typeof body?.model_url === "string" ? body.model_url : null;
    const targetMaxMm = Number(body?.target_max_mm) || undefined;

    let product: any = null;
    if (productId) {
      const { data, error } = await admin
        .from("designer_products")
        .select("id, designer_id, model_url, print_file_url")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Product not found" }, 404);
      product = data;
      modelUrl = modelUrl ?? data.print_file_url ?? data.model_url;
    }

    if (!modelUrl || !/^https:\/\//i.test(modelUrl)) {
      return json({ error: "A public https model URL is required" }, 400);
    }

    const key = productId ?? `${user.id}-${Date.now()}`;
    const prepared = await ensurePrintFile(admin, { modelUrl, key, targetMaxMm });

    if (product) {
      const [{ data: owned }, { data: isAdmin }] = await Promise.all([
        admin.from("designer_profiles").select("id").eq("id", product.designer_id).eq("user_id", user.id).maybeSingle(),
        admin.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (owned || isAdmin === true) {
        await admin
          .from("designer_products")
          .update({ print_file_url: prepared.url })
          .eq("id", product.id);
      }
    }

    return json(prepared);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("prepare-print-file error:", message);
    return json({ error: message }, 500);
  }
});
