import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.4.3";
import { generateStructured } from "../_shared/responses.ts";
import { requireCaller } from "../_shared/requireCaller.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import {
  classifyReply, etDayStart, finalizeBody, MAX_DAILY_TOTAL, nextSendSlot, normalizeEmail, rawEmail,
  remainingToday, splitBatch, trackedLink, waveTimes,
} from "../_shared/outreach.ts";

/**
 * Admin "Outreach" tab: founder cold emails sent one-to-one from Shubham's
 * connected Gmail. Admin actions load contacts, prepare a batch (Lovable AI
 * writes a personal email per person), and schedule it in US-daytime waves.
 * The hourly scheduler ("run") sends due emails within the daily total and
 * reads replies/bounces/opt-outs back from Gmail. Nothing is sent outside the
 * daily total or the 9am–6pm Eastern window.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = "openai/gpt-6-astra";
const GMAIL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me";
const DRAFT_CHUNK = 6;
const SEND_PER_RUN = 25;
const COLS =
  "id, category_slug, email, contact_name, org_name, website, instagram, city, state, followers, personal_detail, source_url, status, outcome, subject, body, scheduled_for, sent_at, replied_at, reply_snippet, last_error, created_at";

type Admin = SupabaseClient;

const CATEGORY_ALIASES: Record<string, string> = {
  petfluencer: "petfluencers", petfluencers: "petfluencers", creators: "petfluencers", influencers: "petfluencers",
  "pet parents": "petfluencers",
  pet_boutiques: "pet_boutiques", "pet boutiques": "pet_boutiques", "pet boutiques & gift shops": "pet_boutiques",
  "pet gift shops": "pet_boutiques", boutiques: "pet_boutiques",
  vet_groomers: "vet_groomers", "veterinary clinics": "vet_groomers", "vet clinics": "vet_groomers",
  "vet clinics & groomers": "vet_groomers", groomers: "vet_groomers",
  memorial_stores: "memorial_stores", "pet memorial stores": "memorial_stores", "online memorial stores": "memorial_stores",
  "pet memorial & gift shops": "memorial_stores",
};

function gmailHeaders() {
  const lovable = Deno.env.get("LOVABLE_API_KEY");
  const gmail = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!lovable || !gmail) throw new Error("Gmail is not connected to this project");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": gmail, "Content-Type": "application/json" };
}

class GmailError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

async function gmail(method: string, path: string, body?: unknown) {
  const r = await fetch(`${GMAIL}${path}`, {
    method, headers: gmailHeaders(), body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) {
    console.error(`Gmail ${method} ${path.split("?")[0]} [${r.status}]: ${text.slice(0, 300)}`);
    let msg = `Gmail error ${r.status}`;
    try { msg = JSON.parse(text)?.error?.message ?? msg; } catch { /* keep */ }
    throw new GmailError(r.status, msg);
  }
  return text ? JSON.parse(text) : {};
}

async function settingsOf(admin: Admin) {
  const { data } = await admin.from("outreach_settings").select("daily_total, wave_size, paused, pause_reason, last_sync_at").eq("id", 1).single();
  return data ?? { daily_total: 25, wave_size: 20, paused: false, pause_reason: null, last_sync_at: null };
}

async function sentTodayCount(admin: Admin) {
  const { count } = await admin.from("outreach_contacts").select("id", { count: "exact", head: true })
    .gte("sent_at", etDayStart(new Date()).toISOString());
  return count ?? 0;
}

// ------------------------------------------------------------------ replies
async function syncReplies(admin: Admin) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: open } = await admin.from("outreach_contacts").select("id, gmail_thread_id")
    .eq("status", "sent").not("gmail_thread_id", "is", null).gte("sent_at", since).limit(2000);
  const byThread = new Map((open ?? []).map((c) => [c.gmail_thread_id as string, c.id as string]));
  let updated = 0;
  if (byThread.size) {
    const list = await gmail("GET", `/messages?q=${encodeURIComponent("newer_than:30d -from:me")}&maxResults=300&fields=messages(id,threadId)`);
    const hits = new Map<string, string>(); // threadId -> latest message id
    for (const m of list.messages ?? []) if (byThread.has(m.threadId) && !hits.has(m.threadId)) hits.set(m.threadId, m.id);
    for (const [threadId, msgId] of [...hits].slice(0, 40)) {
      const m = await gmail("GET", `/messages/${msgId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&fields=snippet,internalDate,payload/headers`);
      const hdr = (n: string) => (m.payload?.headers ?? []).find((h: any) => h.name?.toLowerCase() === n)?.value ?? "";
      const kind = classifyReply(hdr("from"), hdr("subject"), m.snippet ?? "");
      await admin.from("outreach_contacts").update({
        status: kind,
        replied_at: new Date(Number(m.internalDate) || Date.now()).toISOString(),
        reply_snippet: String(m.snippet ?? "").slice(0, 300),
      }).eq("id", byThread.get(threadId)!).eq("status", "sent");
      updated++;
    }
  }
  await admin.from("outreach_settings").update({ last_sync_at: new Date().toISOString() }).eq("id", 1);
  return updated;
}

// ------------------------------------------------------------------ sending
async function sendDue(admin: Admin) {
  const s = await settingsOf(admin);
  if (s.paused) return { sent: 0, note: "Sending is paused" };
  const now = new Date();
  if (nextSendSlot(now).getTime() !== now.getTime()) return { sent: 0, note: "Outside US daytime" };
  const left = remainingToday(s.daily_total, await sentTodayCount(admin));
  if (left <= 0) return { sent: 0, note: "Daily total reached" };

  const { data: claimed, error } = await admin.rpc("claim_outreach_due", { p_limit: Math.min(left, SEND_PER_RUN) });
  if (error) throw error;
  const rows = (claimed ?? []) as any[];
  let sent = 0;
  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    try {
      if (!c.subject || !c.body) throw new GmailError(400, "Email has no text");
      const r = await gmail("POST", "/messages/send", { raw: rawEmail(c.email, c.subject, c.body) });
      await admin.from("outreach_contacts").update({
        status: "sent", sent_at: new Date().toISOString(), gmail_message_id: r.id ?? null,
        gmail_thread_id: r.threadId ?? null, last_error: null,
      }).eq("id", c.id);
      sent++;
    } catch (e) {
      const status = e instanceof GmailError ? e.status : 0;
      const msg = e instanceof Error ? e.message : String(e);
      const rest = rows.slice(i).map((r) => r.id);
      if (status === 429 || status >= 500) {
        // Google is busy: put this and the rest back for the next run.
        await admin.from("outreach_contacts").update({ status: "scheduled", last_error: msg })
          .in("id", rest);
        return { sent, note: "Gmail asked us to slow down; the rest will go next hour" };
      }
      if (status === 401 || status === 403) {
        await admin.from("outreach_contacts").update({ status: "scheduled", last_error: msg }).in("id", rest);
        await admin.from("outreach_settings").update({ paused: true, pause_reason: `Gmail refused: ${msg}` }).eq("id", 1);
        return { sent, note: "Gmail refused the send; sending is paused" };
      }
      await admin.from("outreach_contacts").update({ status: "failed", last_error: msg }).eq("id", c.id);
    }
    if (i < rows.length - 1) await new Promise((r) => setTimeout(r, 2500));
  }
  return { sent };
}

// ------------------------------------------------------------------ writing
const EmailsSchema = z.object({
  emails: z.array(z.object({ line: z.number().int(), subject: z.string(), body: z.string() })),
});

const INSTRUCTIONS = `You write short, personal first-contact emails for Shubham, founder of Nyzora (nyzora.ai).
Nyzora turns a photo of a pet into a personalised sculpture (a bust on a plinth with the pet's name raised on the front), one solid colour, made to order in the USA and shipped in 7–8 business days. Sizes from $59.

For each person you get: their category, the offer for that category, and what we know about them.
Write ONE email per person. It must read like a real note from a founder, not terms and conditions.

Subject: under 45 characters, personal, no hype, no emojis, no ALL CAPS. Sentence case. E.g. "A little gift for Rosebud?" or "A sculpture for your front desk?".

Body: 70–120 words, plain text, first person as Shubham, short paragraphs.
- Greeting: "Hi [first name]," if a real first name is known; otherwise "Hi there," (creators) or "Hi [business name] team," (businesses). Never copy notes such as "unverified", "per LinkedIn" or brackets into the email.
- Opener: one specific, genuine detail from what we know (their pet's name, a recent post, what the shop is known for). Never invent details; if we know little, keep it simple.

For CREATORS (petfluencers), use this shape:
  1. Opener about their pet.
  2. "I'd love to send you a free sculpture of [pet], made from your favourite photo of them."
  3. One sentence: if they love it, all we'd ask is one honest photo or video shared as a Collab post with @nyzora (with #gifted), and that we can reshare it with credit.
  4. One sentence: they'd also get their own code, 10% off for their followers and 10% commission to them on every order.
  5. You MUST include this sentence, worded naturally: "We're choosing our first 30 creator partners this month." (true; no other urgency).
  6. Ask: reply with a favourite photo of [pet].
  Do NOT mention "organic only", "no paid ads", "while live", the 10-order bonus, or other fine print — that comes later when they reply.

For BUSINESSES: opener, the free display piece offer in 1–2 sentences (no cost, no commitment), and the easy ask (reply if they'd like one and we'll ask for a photo). No urgency of any kind.

Both:
- Include the link given for that person exactly once, on its own line, introduced naturally ("You can see the pieces here:").
- Never mention AI, artificial intelligence, 3D printing, or generated images. Never write as if anyone is grieving; keep it a celebration of pets. Memorial businesses are partners, not bereaved customers.
- Do NOT add a sign-off, signature, or opt-out line — they are added automatically.
Return the line number you were given for each person.`;

async function draftChunk(req: Request, admin: Admin) {
  const { data: rows } = await admin.from("outreach_contacts").select(COLS).eq("status", "selected")
    .order("created_at").limit(DRAFT_CHUNK);
  if (!rows?.length) return { drafted: 0, remaining: 0 };
  const { data: cats } = await admin.from("outreach_categories").select("slug, name, kind, offer");
  const catBy = new Map((cats ?? []).map((c) => [c.slug, c]));
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const lines = rows.map((c, i) => {
    const cat = catBy.get(c.category_slug);
    const known = [
      c.contact_name && `name: ${c.contact_name}`, c.org_name && `account/business: ${c.org_name}`,
      c.instagram && `instagram: @${String(c.instagram).replace(/^@/, "")}`, c.city && `city: ${c.city}`,
      c.state && `state: ${c.state}`, c.followers && `followers: ${c.followers}`,
      c.personal_detail && `detail: ${c.personal_detail}`, c.website && `website: ${c.website}`,
    ].filter(Boolean).join("; ");
    return `LINE ${i + 1}\ncategory: ${cat?.name ?? c.category_slug} (${cat?.kind ?? "business"})\noffer: ${cat?.offer ?? ""}\nlink: ${trackedLink(c.category_slug)}\nwhat we know: ${known || "very little"}`;
  });

  const out = await generateStructured(
    req, { apiKey, model: MODEL, reasoningEffort: "low" }, EmailsSchema,
    [{ role: "user", content: lines.join("\n\n") }],
    INSTRUCTIONS,
  );
  let drafted = 0;
  for (const e of out.emails) {
    const c = rows[e.line - 1];
    if (!c || !e.subject.trim() || !e.body.trim()) continue;
    let body = e.body.trim();
    const link = trackedLink(c.category_slug);
    if (!body.includes(link)) body = `${body}\n\nYou can see the pieces here:\n${link}`;
    await admin.from("outreach_contacts").update({
      status: "drafted", subject: e.subject.trim().slice(0, 120), body: finalizeBody(body),
      drafted_at: new Date().toISOString(), last_error: null,
    }).eq("id", c.id).eq("status", "selected");
    drafted++;
  }
  const { count } = await admin.from("outreach_contacts").select("id", { count: "exact", head: true }).eq("status", "selected");
  return { drafted, remaining: count ?? 0 };
}

// ------------------------------------------------------------------ handler
const cleanName = (v: string | null | undefined) => {
  const t = (v ?? "").replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, " ").replace(/\s+/g, " ").trim();
  return t || null;
};

const Row = z.object({
  category: z.string().max(80).optional().nullable(),
  email: z.string().max(254),
  contact_name: z.string().max(120).optional().nullable(),
  org_name: z.string().max(160).optional().nullable(),
  website: z.string().max(300).optional().nullable(),
  instagram: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(40).optional().nullable(),
  followers: z.union([z.number(), z.string()]).optional().nullable(),
  personal_detail: z.string().max(400).optional().nullable(),
  source_url: z.string().max(400).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({})) as Record<string, any>;
  const action = String(body.action ?? "");

  // Scheduler path: send due emails + read replies.
  if (action === "run") {
    // Managed hourly schedule signs with LOVABLE_CRON_SECRET; admins may also trigger it.
    let ok = Deno.env.get("LOVABLE_CRON_SECRET") ? authenticateCronRequest(req) === null : false;
    const caller = ok ? null : await requireCaller(req);
    if (!ok) ok = caller?.kind === "service";
    if (!ok && caller?.userId) {
      const { data } = await admin.rpc("has_role", { _user_id: caller.userId, _role: "admin" });
      ok = !!data;
    }
    if (!ok) return json({ error: "Unauthorized" }, 401);
    const result: Record<string, unknown> = {};
    try { result.replies = await syncReplies(admin); } catch (e) { result.syncError = String(e instanceof Error ? e.message : e); }
    try { Object.assign(result, await sendDue(admin)); } catch (e) { result.sendError = String(e instanceof Error ? e.message : e); }
    console.log("outreach run", result);
    return json(result);
  }

  // Everything else is admin-only.
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "Unauthorized" }, 401);
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Unauthorized" }, 401);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Admin only" }, 403);

  try {
    if (action === "overview") {
      const settings = await settingsOf(admin);
      const { data: cats } = await admin.from("outreach_categories").select("slug, name, kind, daily_share, offer, sort, active").order("sort");
      const { data: all } = await admin.from("outreach_contacts").select("category_slug, status, outcome, sent_at").limit(20000);
      const counts: Record<string, Record<string, number>> = {};
      const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
      let yesThisMonth = 0;
      for (const r of all ?? []) {
        const c = (counts[r.category_slug] ??= {});
        c[r.status] = (c[r.status] ?? 0) + 1;
        if (r.outcome === "yes") c.yes = (c.yes ?? 0) + 1;
        if (r.outcome === "yes" && r.sent_at && new Date(r.sent_at) >= monthStart) yesThisMonth++;
      }
      const { data: batch } = await admin.from("outreach_contacts").select(COLS)
        .in("status", ["selected", "drafted"]).order("category_slug").order("created_at").limit(300);
      const { data: scheduled } = await admin.from("outreach_contacts").select(COLS)
        .in("status", ["scheduled", "sending"]).order("scheduled_for").limit(300);
      let q = admin.from("outreach_contacts").select(COLS);
      if (body.category && body.category !== "all") q = q.eq("category_slug", body.category);
      if (body.status && body.status !== "all") q = q.eq("status", body.status);
      const { data: people } = await q.order("updated_at", { ascending: false }).limit(200);
      return json({
        settings, categories: cats ?? [], counts, batch: batch ?? [], scheduled: scheduled ?? [], people: people ?? [],
        sentToday: await sentTodayCount(admin), yesThisMonth, nextSlot: nextSendSlot(new Date()).toISOString(),
      });
    }

    if (action === "save_settings") {
      const daily = Math.min(MAX_DAILY_TOTAL, Math.max(1, Math.floor(Number(body.daily_total) || 25)));
      const wave = Math.min(50, Math.max(1, Math.floor(Number(body.wave_size) || 20)));
      const patch: Record<string, unknown> = { daily_total: daily, wave_size: wave, updated_at: new Date().toISOString() };
      if (typeof body.paused === "boolean") { patch.paused = body.paused; if (!body.paused) patch.pause_reason = null; }
      await admin.from("outreach_settings").update(patch).eq("id", 1);
      return json({ ok: true });
    }

    if (action === "save_category") {
      const slug = String(body.slug ?? "");
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.daily_share !== undefined) patch.daily_share = Math.min(150, Math.max(0, Math.floor(Number(body.daily_share) || 0)));
      if (typeof body.offer === "string") patch.offer = body.offer.slice(0, 1500);
      if (typeof body.active === "boolean") patch.active = body.active;
      await admin.from("outreach_categories").update(patch).eq("slug", slug);
      return json({ ok: true });
    }

    if (action === "import") {
      const parsed = z.array(Row).max(1000).safeParse(body.rows);
      if (!parsed.success) return json({ error: "Those rows don't look right. Check the file has an email column." }, 400);
      const { data: cats } = await admin.from("outreach_categories").select("slug");
      const valid = new Set((cats ?? []).map((c) => c.slug));
      const fallback = valid.has(body.defaultCategory) ? body.defaultCategory : null;
      const seen = new Set<string>();
      const prepared: Record<string, unknown>[] = [];
      let invalid = 0, noCategory = 0;
      for (const r of parsed.data) {
        const email = normalizeEmail(r.email);
        if (!email || seen.has(email)) { invalid++; continue; }
        const raw = (r.category ?? "").trim().toLowerCase();
        const slug = valid.has(raw) ? raw : CATEGORY_ALIASES[raw] ?? fallback;
        if (!slug) { noCategory++; continue; }
        seen.add(email);
        const followers = Number(String(r.followers ?? "").replace(/[^0-9.]/g, "")) *
          (/k/i.test(String(r.followers ?? "")) ? 1000 : 1);
        prepared.push({
          category_slug: slug, email, contact_name: cleanName(r.contact_name), org_name: r.org_name || null,
          website: r.website || null, instagram: r.instagram ? r.instagram.replace(/^@/, "") : null,
          city: r.city || null, state: r.state || null, followers: Number.isFinite(followers) && followers > 0 ? Math.round(followers) : null,
          personal_detail: r.personal_detail || null, source_url: r.source_url || null, source: "import",
        });
      }
      const emails = prepared.map((p) => p.email as string);
      const existing = new Set<string>();
      for (let i = 0; i < emails.length; i += 200) {
        const { data } = await admin.from("outreach_contacts").select("email").in("email", emails.slice(i, i + 200));
        for (const d of data ?? []) existing.add(String(d.email).toLowerCase());
      }
      const fresh = prepared.filter((p) => !existing.has(p.email as string));
      if (fresh.length) {
        const { error } = await admin.from("outreach_contacts").insert(fresh);
        if (error) throw error;
      }
      return json({ added: fresh.length, alreadyHad: prepared.length - fresh.length, invalid, noCategory });
    }

    if (action === "prepare") {
      const { count: open } = await admin.from("outreach_contacts").select("id", { count: "exact", head: true })
        .in("status", ["selected", "drafted"]);
      if (open) return json({ ok: true, selected: 0, note: "A batch is already being prepared" });
      const s = await settingsOf(admin);
      const total = Math.min(s.daily_total, MAX_DAILY_TOTAL);
      const { data: cats } = await admin.from("outreach_categories").select("slug, daily_share, active").eq("active", true);
      const shares = [];
      for (const c of cats ?? []) {
        const { count } = await admin.from("outreach_contacts").select("id", { count: "exact", head: true })
          .eq("category_slug", c.slug).eq("status", "new");
        shares.push({ slug: c.slug, share: c.daily_share, available: count ?? 0 });
      }
      const split = splitBatch(shares, total);
      const batchId = crypto.randomUUID();
      let selected = 0;
      for (const [slug, n] of Object.entries(split)) {
        if (!n) continue;
        const { data: ids } = await admin.from("outreach_contacts").select("id").eq("category_slug", slug)
          .eq("status", "new").order("created_at").limit(n);
        const list = (ids ?? []).map((r) => r.id);
        if (list.length) {
          await admin.from("outreach_contacts").update({ status: "selected", batch_id: batchId }).in("id", list).eq("status", "new");
          selected += list.length;
        }
      }
      return json({ ok: true, selected, split });
    }

    if (action === "draft") {
      try {
        return json(await draftChunk(req, admin));
      } catch (e: any) {
        const status = Number(e?.statusCode ?? e?.status ?? 0);
        const msg = status === 402 ? "Out of AI credits — add credits to keep writing emails."
          : status === 429 ? "Too many requests right now — try again in a minute."
          : `Couldn't write emails: ${e instanceof Error ? e.message : String(e)}`;
        console.error("outreach draft failed", status, e);
        return json({ error: msg }, status === 402 || status === 429 ? status : 500);
      }
    }

    if (action === "edit") {
      const subject = String(body.subject ?? "").trim().slice(0, 120);
      const text = String(body.body ?? "").trim().slice(0, 4000);
      if (!subject || !text) return json({ error: "Subject and message can't be empty" }, 400);
      await admin.from("outreach_contacts").update({ subject, body: finalizeBody(text) })
        .eq("id", body.id).in("status", ["drafted", "scheduled", "failed"]);
      return json({ ok: true });
    }

    if (action === "skip") {
      await admin.from("outreach_contacts").update({ status: "skipped" }).eq("id", body.id)
        .in("status", ["new", "selected", "drafted", "scheduled", "failed"]);
      return json({ ok: true });
    }

    if (action === "discard_batch") {
      await admin.from("outreach_contacts").update({ status: "new", batch_id: null, subject: null, body: null })
        .in("status", ["selected", "drafted"]);
      return json({ ok: true });
    }

    if (action === "schedule") {
      const s = await settingsOf(admin);
      const { data: rows } = await admin.from("outreach_contacts").select("id, category_slug").eq("status", "drafted")
        .order("category_slug").order("created_at").limit(MAX_DAILY_TOTAL);
      // Round-robin categories so each wave mixes them.
      const groups = new Map<string, string[]>();
      for (const r of rows ?? []) groups.set(r.category_slug, [...(groups.get(r.category_slug) ?? []), r.id]);
      const order: { id: string }[] = [];
      while ([...groups.values()].some((g) => g.length)) for (const g of groups.values()) if (g.length) order.push({ id: g.shift()! });
      const ids = order.map((o) => o.id);
      const times = waveTimes(new Date(), ids.length, s.wave_size);
      for (let k = 0; k < order.length; k++) {
        await admin.from("outreach_contacts").update({ status: "scheduled", scheduled_for: times[k].toISOString() })
          .eq("id", order[k].id).eq("status", "drafted");
      }
      const first = await sendDue(admin);
      return json({ scheduled: ids.length, firstWave: first });
    }

    if (action === "unschedule") {
      await admin.from("outreach_contacts").update({ status: "drafted", scheduled_for: null }).eq("status", "scheduled");
      return json({ ok: true });
    }

    if (action === "retry") {
      await admin.from("outreach_contacts").update({ status: "scheduled", scheduled_for: new Date().toISOString(), last_error: null })
        .eq("id", body.id).eq("status", "failed");
      return json({ ok: true });
    }

    if (action === "mark") {
      const patch: Record<string, unknown> = {};
      if (["yes", "no", null].includes(body.outcome)) patch.outcome = body.outcome;
      if (["replied", "opted_out"].includes(body.status)) {
        patch.status = body.status;
        patch.replied_at = new Date().toISOString();
      }
      await admin.from("outreach_contacts").update(patch).eq("id", body.id);
      return json({ ok: true });
    }

    if (action === "sync") {
      const replies = await syncReplies(admin);
      const sent = await sendDue(admin);
      return json({ replies, ...sent });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("outreach-admin error", action, e);
    return json({ error: e instanceof Error ? e.message : "Something went wrong" }, 500);
  }
});
