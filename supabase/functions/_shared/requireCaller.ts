import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Guard for endpoints that spend money (AI credits, partner API calls) but are
 * deployed with verify_jwt = false so internal service-to-service calls work.
 *
 * Accepts either the platform service-role key (internal callers) or a valid
 * end-user JWT. Anonymous callers are rejected.
 */
export type CallerKind = "service" | "user";

export async function requireCaller(
  req: Request,
): Promise<{ kind: CallerKind; userId: string | null } | null> {
  // Internal scheduler calls authenticate with a shared cron secret header.
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) {
    return { kind: "service", userId: null };
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && token === serviceKey) return { kind: "service", userId: null };

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return { kind: "user", userId: data.user.id };
}

export const unauthorized = (corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
