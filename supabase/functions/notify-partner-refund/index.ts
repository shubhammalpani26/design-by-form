import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
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

  // Admin-only: internal ops email to the print partner.
  const internal = req.headers.get("x-internal-key");
  if (internal !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data } = await admin.auth.getUser(token);
    if (!data?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (isAdmin !== true) return json({ error: "Unauthorized" }, 401);
  }

  const result = await sendTemplateEmail(
    "partner-refund-request",
    "support@slant3d.com",
    {
      replyTo: "shubham.malpani@cyanique.com",
      idempotencyKey: "partner-refund-SLANT_1788296455408",
      templateData: {},
    },
  );

  return json(result);
});
