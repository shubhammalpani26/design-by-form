import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    const userId = u?.user?.id;
    if (!userId) return json({ error: "Not signed in." }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (isAdmin !== true) return json({ error: "Only admins can delete customer previews." }, 403);

    const body = await req.json().catch(() => null);
    const id = String(body?.previewId ?? "");
    if (!UUID.test(id)) return json({ error: "Invalid preview id." }, 400);

    const { data: row } = await admin
      .from("originals_previews")
      .select("source_image_url, preview_image_url")
      .eq("id", id)
      .maybeSingle();
    if (!row) return json({ error: "Preview not found." }, 404);

    if (row.source_image_url) {
      const { error } = await admin.storage.from("originals-uploads").remove([row.source_image_url]);
      if (error) console.error("source remove failed", error);
    }
    const url = row.preview_image_url ?? "";
    if (url.includes("/product-images/")) {
      const path = decodeURIComponent(url.split("/product-images/")[1].split("?")[0]);
      if (path) {
        const { error } = await admin.storage.from("product-images").remove([path]);
        if (error) console.error("render remove failed", error);
      }
    }

    await admin.from("print_validation_events").delete().eq("preview_id", id);
    const { error: dErr } = await admin.from("originals_previews").delete().eq("id", id);
    if (dErr) return json({ error: dErr.message }, 400);
    return json({ ok: true });
  } catch (e) {
    console.error("admin-delete-preview", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
