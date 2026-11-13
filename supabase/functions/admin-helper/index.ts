import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@4.0.106";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "npm:ai@7.0.159";
import { z } from "npm:zod@4.4.3";
import { LOVABLE_AI_GATEWAY_URL } from "../_shared/responses.ts";
import {
  createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader,
} from "../_shared/run-id.ts";
import { captionProblem, SOCIAL_RULES, ADS_RULES, isOurAccount } from "./rules.ts";

/**
 * Admin chat helpers for the Social and Ads tabs. One saved conversation per
 * helper. Social may edit/skip/restore upcoming posts and add drafts that wait
 * for the owner's approval; Ads explains numbers and can only PAUSE. Neither
 * can turn ads on, change budgets, publish, or change the website.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = "openai/gpt-6-astra";
const META_GATEWAY = "https://connector-gateway.lovable.dev/meta_ads/v26.0";
const HISTORY_FOR_MODEL = 40;
type Helper = "social" | "ads";

const et = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET" : null;

async function notesOf(admin: SupabaseClient, helper: Helper) {
  const { data } = await admin.from("admin_agent_notes").select("id, note, created_at").eq("helper", helper).eq("active", true)
    .order("created_at").limit(100);
  return data ?? [];
}

function noteTools(admin: SupabaseClient, helper: Helper) {
  return {
    remember: tool({
      description: "Save a standing rule or preference the owner just stated (e.g. 'no more posts with text overlays'). Use only for lasting preferences, in the owner's words.",
      inputSchema: z.object({ note: z.string().min(3).max(500) }),
      execute: async ({ note }) => {
        const { data, error } = await admin.from("admin_agent_notes").insert({ helper, note }).select("id").single();
        if (error) throw new Error(error.message);
        return { saved: true, id: data.id };
      },
    }),
    forget: tool({
      description: "Stop following a saved rule when the owner asks.",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { error } = await admin.from("admin_agent_notes").update({ active: false }).eq("id", id).eq("helper", helper);
        if (error) throw new Error(error.message);
        return { forgotten: true };
      },
    }),
  };
}

// ------------------------------------------------------------------ social
const POST_COLS = "id, scheduled_at, slot_type, theme, caption, image_url, media_urls, status, engineering_status, fb_status, published_at, last_error";
const OPEN = ["scheduled", "ready", "needs_review", "failed", "draft"];

function socialTools(admin: SupabaseClient, jwt: string) {
  const getOpen = async (id: string) => {
    const { data } = await admin.from("social_scheduled_posts").select(POST_COLS).eq("id", id).maybeSingle();
    if (!data) throw new Error("Post not found");
    return data;
  };
  const shape = (p: any) => ({
    id: p.id, when: et(p.scheduled_at), type: p.slot_type, status: p.status === "cancelled" ? "skipped" : p.status,
    theme: p.theme, caption: p.caption, media: p.media_urls?.length ? p.media_urls : p.image_url ? [p.image_url] : [],
    posted_at: et(p.published_at), problem: p.last_error,
  });
  return {
    list_posts: tool({
      description: "List social posts. 'upcoming' = not yet posted (soonest first, includes drafts); 'posted' = most recent first; 'skipped' = skipped posts.",
      inputSchema: z.object({ which: z.enum(["upcoming", "posted", "skipped"]), limit: z.number().int().min(1).max(30) }),
      execute: async ({ which, limit }) => {
        let q = admin.from("social_scheduled_posts").select(POST_COLS);
        if (which === "upcoming") q = q.in("status", OPEN).order("scheduled_at", { ascending: true });
        else if (which === "posted") q = q.eq("status", "published").order("published_at", { ascending: false });
        else q = q.eq("status", "cancelled").order("scheduled_at", { ascending: false });
        const { data, error } = await q.limit(limit);
        if (error) throw new Error(error.message);
        return { now: et(new Date().toISOString()), posts: (data ?? []).map(shape) };
      },
    }),
    edit_post: tool({
      description: "Change the caption and/or posting time of a post that has not been posted yet. Time is ISO 8601 with offset.",
      inputSchema: z.object({ id: z.string().uuid(), caption: z.string().max(2200).nullable(), scheduled_at: z.string().nullable() }),
      execute: async ({ id, caption, scheduled_at }) => {
        const p = await getOpen(id);
        if (!OPEN.includes(p.status)) throw new Error(`Can't edit a post that is ${p.status}`);
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (caption !== null) {
          const bad = captionProblem(caption);
          if (bad) throw new Error(bad);
          patch.caption = caption;
        }
        if (scheduled_at !== null) {
          const t = new Date(scheduled_at);
          if (isNaN(t.getTime()) || t.getTime() < Date.now() + 5 * 60_000) throw new Error("Pick a time at least 5 minutes from now");
          patch.scheduled_at = t.toISOString();
          if (p.fb_status === "pending") patch.fb_scheduled_at = null;
        }
        const { error } = await admin.from("social_scheduled_posts").update(patch).eq("id", id).in("status", OPEN);
        if (error) throw new Error(error.message);
        return shape(await getOpen(id));
      },
    }),
    skip_post: tool({
      description: "Skip an upcoming post so it never goes out (can be restored).",
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await admin.from("social_scheduled_posts").update({ status: "cancelled" }).eq("id", id).in("status", OPEN).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) throw new Error("That post can't be skipped (already posted or skipped)");
        return { skipped: true };
      },
    }),
    restore_post: tool({
      description: "Bring a skipped post back. It returns to 'ready' if it has its image, otherwise waits for one.",
      inputSchema: z.object({ id: z.string().uuid(), scheduled_at: z.string().nullable() }),
      execute: async ({ id, scheduled_at }) => {
        const p = await getOpen(id);
        if (p.status !== "cancelled") throw new Error("That post isn't skipped");
        const when = scheduled_at ? new Date(scheduled_at) : new Date(p.scheduled_at);
        if (isNaN(when.getTime()) || when.getTime() < Date.now() + 5 * 60_000) throw new Error("Its time has passed — give a new time at least 5 minutes from now");
        const { error } = await admin.from("social_scheduled_posts").update({
          status: p.image_url ? "ready" : "scheduled", scheduled_at: when.toISOString(), last_error: null,
        }).eq("id", id).eq("status", "cancelled");
        if (error) throw new Error(error.message);
        return shape(await getOpen(id));
      },
    }),
    list_media: tool({
      description: "Real photos and videos already used in our posts, which new drafts may reuse. Returns URL, type and the caption it was used with.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(60) }),
      execute: async ({ limit }) => {
        const { data } = await admin.from("social_scheduled_posts").select("image_url, media_urls, slot_type, caption, is_render, scheduled_at")
          .not("image_url", "is", null).eq("is_render", false).order("scheduled_at", { ascending: false }).limit(200);
        const seen = new Map<string, any>();
        for (const r of data ?? []) {
          const urls: string[] = r.media_urls?.length ? r.media_urls : [r.image_url];
          for (const u of urls) if (u && !seen.has(u)) seen.set(u, { url: u, video: /\.(mp4|mov)(\?|$)/i.test(u), used_in: r.slot_type, last_used: et(r.scheduled_at), caption: (r.caption ?? "").slice(0, 140) });
        }
        return { media: [...seen.values()].slice(0, limit) };
      },
    }),
    draft_post: tool({
      description: "Create a NEW post as a draft that waits for the owner's approval in the Social tab. Only reuse media URLs returned by list_media. type: feed (one photo), carousel (2–10 photos), reel (one video).",
      inputSchema: z.object({
        type: z.enum(["feed", "carousel", "reel"]), media: z.array(z.string()).min(1).max(10),
        caption: z.string().min(10).max(2200), scheduled_at: z.string(), theme: z.string().max(80).nullable(),
      }),
      execute: async ({ type, media, caption, scheduled_at, theme }) => {
        const bad = captionProblem(caption);
        if (bad) throw new Error(bad);
        const when = new Date(scheduled_at);
        if (isNaN(when.getTime()) || when.getTime() < Date.now() + 10 * 60_000) throw new Error("Pick a time at least 10 minutes from now");
        const { data: rows } = await admin.from("social_scheduled_posts").select("image_url, media_urls").not("image_url", "is", null).eq("is_render", false).limit(1000);
        const allowed = new Set<string>();
        for (const r of rows ?? []) { if (r.image_url) allowed.add(r.image_url); for (const u of r.media_urls ?? []) allowed.add(u); }
        const unknown = media.filter((u) => !allowed.has(u));
        if (unknown.length) throw new Error("Use only our existing real photos/videos (from list_media)");
        const isVid = (u: string) => /\.(mp4|mov)(\?|$)/i.test(u);
        if (type === "reel" && (media.length !== 1 || !isVid(media[0]))) throw new Error("A Reel needs exactly one video");
        if (type === "feed" && (media.length !== 1 || isVid(media[0]))) throw new Error("A single post needs exactly one photo");
        if (type === "carousel" && (media.length < 2 || media.some(isVid))) throw new Error("A carousel needs 2–10 photos");
        const { data, error } = await admin.from("social_scheduled_posts").insert({
          scheduled_at: when.toISOString(), slot_type: type, theme: theme ?? "Drafted in chat", caption, image_prompt: "",
          image_url: media[0], media_urls: type === "carousel" ? media : null, is_render: false,
          engineering_status: "skipped", status: "draft", fb_status: "skip", day_index: 0,
        }).select(POST_COLS).single();
        if (error) throw new Error(error.message);
        return { ...shape(data), note: "Waiting for the owner's Approve tap in the Social tab." };
      },
    }),
    instagram_stats: tool({
      description: "Organic Instagram and Facebook Page stats (followers, reach, recent post performance). Read-only.",
      inputSchema: z.object({}),
      execute: async () => {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/social-scheduler`, {
          method: "POST", headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
          body: JSON.stringify({ action: "insights" }),
        });
        const t = await r.text();
        if (!r.ok) throw new Error(`Stats unavailable (${r.status}): ${t.slice(0, 200)}`);
        return t.length > 40_000 ? { truncated: true, stats: t.slice(0, 40_000) } : JSON.parse(t);
      },
    }),
  };
}

// ------------------------------------------------------------------ ads
function adsTools(jwt: string) {
  const metaKey = Deno.env.get("META_ADS_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const meta = async (path: string, init?: RequestInit) => {
    if (!metaKey || !lovableKey) throw new Error("Meta Ads connection is not linked");
    const r = await fetch(`${META_GATEWAY}${path}`, {
      ...init, headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": metaKey, ...(init?.headers ?? {}) },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.error) throw new Error(j?.error?.error_user_msg ?? j?.error?.message ?? `Meta error ${r.status}`);
    return j;
  };
  return {
    ads_report: tool({
      description: "Full ads snapshot for the last 1, 7 or 30 days (India-time days): money left, each ad's spend/clicks/results, ages/genders/states, daily trend, site funnel (photo → preview → checkout → payment) per campaign, and warnings. Read-only.",
      inputSchema: z.object({ days: z.union([z.literal(1), z.literal(7), z.literal(30)]) }),
      execute: async ({ days }) => {
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/admin-ads-stats`, {
          method: "POST", headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
          body: JSON.stringify({ days }),
        });
        const t = await r.text();
        if (!r.ok) throw new Error(`Report unavailable (${r.status}): ${t.slice(0, 200)}`);
        return t.length > 60_000 ? { truncated: true, report: t.slice(0, 60_000) } : JSON.parse(t);
      },
    }),
    pause: tool({
      description: "PAUSE an ad, ad set or campaign by its Meta id — only when the owner explicitly asked to pause it in this conversation. This tool can never turn anything on.",
      inputSchema: z.object({ id: z.string().regex(/^\d{6,25}$/), name: z.string().max(200) }),
      execute: async ({ id }) => {
        const before = await meta(`/${id}?fields=id,name,account_id,effective_status`);
        if (!isOurAccount(before.account_id)) throw new Error("That id isn't in the Nyzora ad account");
        if (before.effective_status === "PAUSED") return { already_paused: true, name: before.name };
        await meta(`/${id}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "status=PAUSED" });
        const after = await meta(`/${id}?fields=id,name,status,effective_status`);
        return { paused: after.status === "PAUSED", name: after.name, now: after.effective_status };
      },
    }),
  };
}

// ------------------------------------------------------------------ handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({})) as Record<string, any>;
    const helper: Helper | null = body.helper === "social" || body.helper === "ads" ? body.helper : null;
    if (!helper) return json({ error: "Unknown helper" }, 400);

    if (body.action === "history") {
      const { data, error } = await admin.from("admin_agent_messages").select("message").eq("helper", helper)
        .order("created_at", { ascending: true }).limit(400);
      if (error) throw error;
      return json({ messages: (data ?? []).map((r) => r.message), notes: await notesOf(admin, helper) });
    }
    if (body.action === "clear") {
      const { error } = await admin.from("admin_agent_messages").delete().eq("helper", helper);
      if (error) throw error;
      return json({ ok: true });
    }

    const parsed = z.array(z.object({ id: z.string().min(1).max(100), role: z.enum(["user", "assistant", "system"]) }).passthrough())
      .min(1).max(500).safeParse(body.messages);
    if (!parsed.success) return json({ error: "Bad messages" }, 400);
    const messages = (parsed.data as unknown as UIMessage[]).filter((m) => m.role !== "system");
    const last = messages[messages.length - 1];
    if (last?.role !== "user") return json({ error: "Last message must be from you" }, 400);

    const { error: saveErr } = await admin.from("admin_agent_messages")
      .upsert({ helper, msg_id: last.id, role: "user", message: last }, { onConflict: "helper,msg_id", ignoreDuplicates: true });
    if (saveErr) return json({ error: `Couldn't save your message: ${saveErr.message}` }, 500);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);
    const notes = await notesOf(admin, helper);
    const instructions = `${helper === "social" ? SOCIAL_RULES : ADS_RULES}

Current time: ${et(new Date().toISOString())} (${new Date().toISOString()}).
Owner's saved preferences (follow them; ids let you forget one when asked):
${notes.length ? notes.map((n) => `- [${n.id}] ${n.note}`).join("\n") : "- none yet"}`;

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const provider = createOpenAI({
      baseURL: LOVABLE_AI_GATEWAY_URL, apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    const tools = { ...noteTools(admin, helper), ...(helper === "social" ? socialTools(admin, jwt) : adsTools(jwt)) };
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages: await convertToModelMessages(messages.slice(-HISTORY_FOR_MODEL), { tools }),
      tools,
      stopWhen: stepCountIs(10),
      abortSignal: req.signal,
      providerOptions: {
        openai: { store: false, forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
      },
    });
    const response = result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      headers: corsHeaders,
      onError: (e) => (e instanceof Error ? e.message : String(e)),
      onFinish: async ({ responseMessage }) => {
        if (!responseMessage?.parts?.length) return;
        const { error } = await admin.from("admin_agent_messages")
          .upsert({ helper, msg_id: responseMessage.id, role: "assistant", message: responseMessage }, { onConflict: "helper,msg_id" });
        if (error) console.error("save assistant message failed", error.message);
      },
    });
    return withLovableAiGatewayRunIdHeader(response, runIdFetch, corsHeaders);
  } catch (e) {
    console.error("admin-helper", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
