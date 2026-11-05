import { createClient } from "npm:@supabase/supabase-js@2";
import { sendAppEmail } from "../_shared/appEmail.ts";
import { requireCaller, unauthorized } from "../_shared/requireCaller.ts";
import { PRICE_BOOK } from "../_shared/originalsPricing.ts";
import {
  decideReminder,
  MAX_OPTINS_PER_EMAIL_PER_DAY,
  MAX_OPTINS_PER_NETWORK_PER_DAY,
  MAX_PREVIEW_AGE_MS,
  normalizeEmail,
  reminderDueAt,
  previewEmailSubject,
  savedPreviewLink,
} from "../_shared/previewEmail.ts";

/**
 * Opt-in "Email me my preview" for the Originals reveal screen.
 *  - save:      shopper asks for their preview by email → send it now and
 *               schedule ONE reminder 2 days later.
 *  - restore:   the email's link reopens that exact preview on the product page.
 *  - reminders: hourly scheduler sends due reminders (skips anyone who paid).
 * The browser never chooses the template or a recipient other than the one it
 * typed, and can only email a preview made on its own network or account.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[0-9a-f]{20,64}$/i;
const KEY = /^[a-z0-9_-]{1,32}$/i;
const DAY = 86_400_000;

async function hashIp(ip: string) {
  const data = new TextEncoder().encode(`nyzora-originals:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromPrice(skuSlug: string): number | undefined {
  const sizes = Object.values(PRICE_BOOK[skuSlug] ?? {});
  return sizes.length ? Math.min(...sizes.map((s) => s.usd)) : undefined;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const action = body.action;

  try {
    // ------------------------------------------------------------ save
    if (action === "save") {
      const previewId = typeof body.previewId === "string" && UUID.test(body.previewId) ? body.previewId : null;
      const email = normalizeEmail(body.email);
      const colorKey = typeof body.colorKey === "string" && KEY.test(body.colorKey) ? body.colorKey : null;
      const sizeKey = typeof body.sizeKey === "string" && KEY.test(body.sizeKey) ? body.sizeKey : null;
      if (!previewId) return json({ error: "Preview not found" }, 400);
      if (!email) return json({ error: "Please enter a valid email address." }, 400);

      let userId: string | null = null;
      const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
      if (token) {
        const { data } = await admin.auth.getUser(token);
        userId = data?.user?.id ?? null;
      }
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
      const ipHash = await hashIp(ip);

      const { data: preview } = await admin
        .from("originals_previews")
        .select("id, user_id, ip_hash, sku_slug, personalization, preview_image_url, photo_screen, created_at")
        .eq("id", previewId)
        .maybeSingle();
      if (!preview || !preview.preview_image_url) return json({ error: "Preview not found" }, 404);
      if (typeof preview.photo_screen === "string" && preview.photo_screen.startsWith("rejected")) {
        return json({ error: "Preview not found" }, 404);
      }
      if (Date.now() - new Date(preview.created_at).getTime() > MAX_PREVIEW_AGE_MS) {
        return json({ error: "This preview is too old to email — make a fresh one, it's free." }, 410);
      }
      const owns = (userId && preview.user_id === userId) || preview.ip_hash === ipHash;
      if (!owns) return json({ error: "We couldn't email this preview from here. Please try again on the device you made it on." }, 403);

      // Same preview + same address: already sent, don't send twice.
      const { data: existing } = await admin
        .from("originals_preview_emails")
        .select("id, token, sent_at")
        .eq("preview_id", previewId)
        .eq("email", email)
        .maybeSingle();
      if (existing?.sent_at) return json({ ok: true, alreadySent: true });
      // A checkout-reminder row (queued at checkout, never emailed) must not
      // block the saved-preview email: send it on that same row.
      let row: { id: string; token: string } | null = existing
        ? { id: existing.id, token: existing.token }
        : null;

      if (!row) {
      const since = new Date(Date.now() - DAY).toISOString();
      const [{ count: byNet }, { count: byEmail }] = await Promise.all([
        admin.from("originals_preview_emails").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
        admin.from("originals_preview_emails").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since),
      ]);
      if ((byNet ?? 0) >= MAX_OPTINS_PER_NETWORK_PER_DAY || (byEmail ?? 0) >= MAX_OPTINS_PER_EMAIL_PER_DAY) {
        return json({ error: "You've saved a few previews already today. Try again tomorrow." }, 429);
      }

      const now = new Date();
      const { data: inserted, error: insErr } = await admin
        .from("originals_preview_emails")
        .insert({
          preview_id: previewId,
          email,
          sku_slug: preview.sku_slug,
          ip_hash: ipHash,
          user_id: userId,
          color_key: colorKey,
          size_key: sizeKey,
          reminder_due_at: reminderDueAt(now).toISOString(),
        })
        .select("id, token")
        .single();
      if (insErr || !inserted) {
        if (insErr?.code === "23505") return json({ ok: true, alreadySent: true });
        console.error("preview email insert failed", insErr);
        return json({ error: "Something went wrong. Please try again." }, 500);
      }
      row = inserted;
      }

      const result = await sendAppEmail("originals-preview-saved", email, {
        templateData: {
          ...previewEmailSubject(preview.sku_slug, preview.personalization),
          previewUrl: preview.preview_image_url,
          link: savedPreviewLink(preview.sku_slug, row.token),
          fromPrice: fromPrice(preview.sku_slug),
        },
        idempotencyKey: `preview-saved-${row.id}`,
        replyTo: "contact@nyzora.ai",
      });

      if (result.sent) {
        await admin.from("originals_preview_emails").update({ sent_at: new Date().toISOString() }).eq("id", row.id);
        return json({ ok: true });
      }
      // Suppressed (they unsubscribed before) or failed: no reminder either.
      await admin
        .from("originals_preview_emails")
        .update({ reminder_skipped_reason: result.reason === "recipient_suppressed" ? "suppressed" : "first_send_failed" })
        .eq("id", row.id);
      if (result.reason === "recipient_suppressed") {
        return json({ error: "This address has turned off emails from Nyzora." }, 409);
      }
      return json({ error: "We couldn't send the email just now. Please try again." }, 502);
    }

    // ------------------------------------------------------------ restore
    if (action === "restore") {
      const token = typeof body.token === "string" && TOKEN.test(body.token) ? body.token : null;
      if (!token) return json({ error: "Not found" }, 404);
      const { data: optin } = await admin
        .from("originals_preview_emails")
        .select("preview_id, color_key, size_key, sku_slug")
        .eq("token", token)
        .maybeSingle();
      if (!optin) return json({ error: "Not found" }, 404);
      const { data: preview } = await admin
        .from("originals_previews")
        .select("id, sku_slug, personalization, preview_image_url, source_image_url")
        .eq("id", optin.preview_id)
        .maybeSingle();
      if (!preview?.preview_image_url) return json({ error: "Not found" }, 404);
      const p = (preview.personalization ?? {}) as Record<string, unknown>;
      return json({
        previewId: preview.id,
        previewUrl: preview.preview_image_url,
        skuSlug: preview.sku_slug,
        mode: preview.source_image_url ? "photo" : "template",
        heading: typeof p.heading === "string" ? p.heading : "",
        footnote: typeof p.footnote === "string" ? p.footnote : "",
        colorKey: optin.color_key ?? (typeof p.color === "string" ? p.color : null),
        sizeKey: optin.size_key,
      });
    }

    // ------------------------------------------------------------ reminders
    if (action === "reminders") {
      const caller = await requireCaller(req);
      if (!caller || caller.kind !== "service") return unauthorized(corsHeaders);

      const nowIso = new Date().toISOString();
      const { data: due } = await admin
        .from("originals_preview_emails")
        .select("id, preview_id, email, token, sku_slug, reminder_due_at, reminder_sent_at, created_at")
        .is("reminder_sent_at", null)
        .is("reminder_skipped_reason", null)
        .lte("reminder_due_at", nowIso)
        .order("reminder_due_at", { ascending: true })
        .limit(50);

      const outcome = { sent: 0, skipped: 0, failed: 0 };
      for (const r of due ?? []) {
        // Claim first so overlapping runs can never send twice.
        const { data: claimed } = await admin
          .from("originals_preview_emails")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", r.id)
          .is("reminder_sent_at", null)
          .select("id");
        if (!claimed?.length) continue;

        const [{ data: preview }, { count: paidForPreview }, { count: paidByEmail }] = await Promise.all([
          admin.from("originals_previews").select("id, personalization, preview_image_url").eq("id", r.preview_id).maybeSingle(),
          admin.from("originals_orders").select("id", { count: "exact", head: true })
            .eq("preview_id", r.preview_id).in("status", ["paid", "fulfilled", "refunded"]),
          admin.from("originals_orders").select("id", { count: "exact", head: true })
            .ilike("customer_email", r.email).in("status", ["paid", "fulfilled", "refunded"]).gte("created_at", r.created_at),
        ]);

        const decision = decideReminder({
          now: new Date(),
          dueAt: new Date(r.reminder_due_at),
          reminderSentAt: null,
          previewExists: Boolean(preview?.preview_image_url),
          hasPaidOrder: (paidForPreview ?? 0) > 0 || (paidByEmail ?? 0) > 0,
        });
        if (!decision.send) {
          await admin.from("originals_preview_emails")
            .update({ reminder_sent_at: null, reminder_skipped_reason: decision.reason }).eq("id", r.id);
          outcome.skipped++;
          continue;
        }

        const result = await sendAppEmail("originals-preview-reminder", r.email, {
          templateData: {
            ...previewEmailSubject(r.sku_slug, preview!.personalization),
            previewUrl: preview!.preview_image_url,
            link: savedPreviewLink(r.sku_slug, r.token),
          },
          idempotencyKey: `preview-reminder-${r.id}`,
          replyTo: "contact@nyzora.ai",
        });
        if (result.sent) {
          outcome.sent++;
        } else {
          // Never retry a reminder: one attempt only.
          await admin.from("originals_preview_emails")
            .update({ reminder_sent_at: null, reminder_skipped_reason: result.reason === "recipient_suppressed" ? "suppressed" : "send_failed" })
            .eq("id", r.id);
          result.reason === "recipient_suppressed" ? outcome.skipped++ : outcome.failed++;
        }
      }
      return json({ ok: true, checked: due?.length ?? 0, ...outcome });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("originals-preview-email error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
