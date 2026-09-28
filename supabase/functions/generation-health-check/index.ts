import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAppEmail } from "../_shared/appEmail.ts";

/**
 * Watches visitor preview generation for mass failures (e.g. exhausted AI
 * credits, model outage). Runs on a cron. If the last hour shows enough
 * attempts with an ~total failure rate, admins get a dashboard notification
 * and contact@nyzora.ai gets one email — at most once every 6 hours while the
 * outage persists.
 */

const WINDOW_MINUTES = 60;
const MIN_ATTEMPTS = 3;
const FAILURE_RATE = 0.8;
const ALERT_COOLDOWN_HOURS = 6;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { data: events, error } = await admin
    .from("experiment_events")
    .select("event")
    .eq("experiment", "render_progress")
    .gte("created_at", since)
    .limit(1000);

  if (error) {
    console.error("health check: event query failed", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const starts = (events ?? []).filter((e) => e.event === "generate_start").length;
  const errors = (events ?? []).filter((e) => e.event === "generate_error").length;
  const successes = (events ?? []).filter((e) => e.event === "generate_success").length;

  const failing =
    starts >= MIN_ATTEMPTS && errors / Math.max(starts, 1) >= FAILURE_RATE;

  if (!failing) {
    return new Response(
      JSON.stringify({ ok: true, failing: false, starts, errors, successes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Cooldown: skip if we already alerted recently.
  const cooldownSince = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 3_600_000).toISOString();
  const { data: recent } = await admin
    .from("email_send_log")
    .select("id")
    .eq("template_name", "generation-failing")
    .eq("status", "sent")
    .gte("created_at", cooldownSince)
    .limit(1);

  if (recent?.length) {
    return new Response(
      JSON.stringify({ ok: true, failing: true, alerted: false, reason: "cooldown", starts, errors, successes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const summary = `${errors}/${starts} generations failed in the last ${WINDOW_MINUTES} min (${successes} succeeded)`;

  try {
    const { data: admins } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          title: "Preview generation is failing",
          message: `${summary}. Likely exhausted AI credits — top up the workspace balance.`,
          type: "generation_failing",
          link: "/admin?tab=orders",
          metadata: { starts, errors, successes, window_minutes: WINDOW_MINUTES },
        })),
      );
    }
  } catch (e) {
    console.error("health check: notification insert failed", e);
  }

  await sendAppEmail("generation-failing", "contact@nyzora.ai", {
    idempotencyKey: `generation-failing-${new Date().toISOString().slice(0, 13)}`,
    templateData: {
      windowMinutes: WINDOW_MINUTES,
      starts,
      errors,
      successes,
      note: summary,
    },
  });

  return new Response(
    JSON.stringify({ ok: true, failing: true, alerted: true, starts, errors, successes }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
