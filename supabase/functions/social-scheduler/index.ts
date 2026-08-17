import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const FB_API = "https://graph.facebook.com/v18.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

/** Bounded work per run — the scheduler never drains the whole queue at once. */
const RENDER_BATCH = 4;
const PUBLISH_BATCH = 2;
const RENDER_LOOKAHEAD_MS = 8 * 24 * 60 * 60 * 1000;
const LEASE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

/** Appended to every render prompt so the creative is manufacturable, not just pretty. */
const PRINTABILITY_CLAUSE =
  " Manufacturing constraints: a single solid monolithic form with a wide flat base sitting fully on the surface, " +
  "no floating or cantilevered elements, no thin stems or wires, no lattice or perforations, all overhangs kept under 45 degrees, " +
  "no separate accessories or props touching the piece, minimum wall thickness of 3mm, chest and neck extended forward to fully support the chin.";

/** Every product render must visibly prove the piece is personalised from the customer's own photo. */
const ENGRAVING_CLAUSE =
  " Personalisation: the front face of the thick flat base plinth carries crisp recessed engraved lettering, " +
  "clearly legible and correctly spelled, in a small clean uppercase sans-serif — a short pet name and beneath it a smaller line of dates " +
  "(for example \"BAILEY\" above \"2011 — 2024\"). The engraving is cut into the base itself, catches a soft shadow, and is sharp and in focus. " +
  "Frame the shot so the engraved base is fully visible in the lower third and never cropped.";

const FORMAT_CLAUSE = " Vertical 4:5 portrait framing suitable for an Instagram feed post.";

const renderPrompt = (p: string) => `${p}${ENGRAVING_CLAUSE}${PRINTABILITY_CLAUSE}${FORMAT_CLAUSE}`;

type Post = {
  id: string;
  scheduled_at: string;
  slot_type: "feed" | "story";
  caption: string;
  image_prompt: string;
  image_url: string | null;
  is_render: boolean;
  engineering_status: string;
  attempts: number;
};

async function pause(reason: string) {
  await admin
    .from("social_scheduler_state")
    .update({ paused: true, pause_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", "default");
}

/* ------------------------------- rendering ------------------------------- */

function decodeDataUrl(dataUrl: string) {
  const m = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  return { mime: m[1].toLowerCase(), bytes: Uint8Array.from(atob(m[3]), (c) => c.charCodeAt(0)) };
}

async function renderImage(prompt: string): Promise<{ url?: string; status?: number; error?: string }> {
  if (!LOVABLE_API_KEY) return { error: "AI is not configured" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) return { status: res.status, error: (await res.text()).slice(0, 400) };
  const data = await res.json();
  const dataUrl: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const decoded = dataUrl ? decodeDataUrl(dataUrl) : null;
  if (!decoded) return { error: "no image returned" };
  const path = `social/${crypto.randomUUID()}.png`;
  const { error } = await admin.storage.from("product-images").upload(path, decoded.bytes, {
    contentType: decoded.mime,
    upsert: false,
  });
  if (error) return { error: `upload failed: ${error.message}` };
  return { url: admin.storage.from("product-images").getPublicUrl(path).data.publicUrl };
}

/** Every product render is gated by the engineering agent before it can post. */
async function engineeringCheck(imageUrl: string, prompt: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/engineering-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({
      imageUrl,
      prompt,
      category: "Figurines & Miniatures",
      manufacturingMethod: "fdm_us",
    }),
  });
  if (!res.ok) throw new Error(`engineering-check ${res.status}`);
  return (await res.json()) as { pass?: boolean; confidence?: number; issues?: string[]; skipped?: boolean };
}

async function renderDue() {
  const horizon = new Date(Date.now() + RENDER_LOOKAHEAD_MS).toISOString();
  const { data } = await admin
    .from("social_scheduled_posts")
    .select("id, scheduled_at, slot_type, caption, image_prompt, image_url, is_render, engineering_status, attempts")
    .eq("status", "scheduled")
    .is("image_url", null)
    .lte("scheduled_at", horizon)
    .lt("attempts", MAX_ATTEMPTS)
    .order("scheduled_at", { ascending: true })
    .limit(RENDER_BATCH);

  const posts = (data ?? []) as Post[];
  for (const post of posts) {
    const rendered = await renderImage(post.is_render ? renderPrompt(post.image_prompt) : post.image_prompt);
    if (!rendered.url) {
      if (rendered.status === 402 || rendered.status === 403) {
        await pause(`AI gateway ${rendered.status}: ${rendered.error ?? "blocked"}`);
        return { paused: true };
      }
      await admin
        .from("social_scheduled_posts")
        .update({ attempts: post.attempts + 1, last_error: rendered.error ?? "render failed" })
        .eq("id", post.id);
      continue;
    }

    let engineering: unknown = null;
    let engineering_status = "skipped";
    if (post.is_render) {
      try {
        const verdict = await engineeringCheck(rendered.url, post.image_prompt);
        engineering = verdict;
        engineering_status = verdict.skipped ? "skipped" : verdict.pass === false ? "fail" : "pass";
      } catch (e) {
        engineering_status = "pending";
        engineering = { error: (e as Error).message };
      }
    }

    // A render the engineering agent rejects never auto-publishes — it parks for review.
    const status =
      engineering_status === "fail" || engineering_status === "pending" ? "needs_review" : "ready";

    await admin
      .from("social_scheduled_posts")
      .update({
        image_url: rendered.url,
        engineering,
        engineering_status,
        status,
        attempts: post.attempts + 1,
        last_error: engineering_status === "fail" ? "Engineering agent rejected this render" : null,
      })
      .eq("id", post.id);
  }
  return { rendered: posts.length };
}

/* ------------------------------- publishing ------------------------------ */

async function fb(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${FB_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta ${res.status} ${path}: ${text.slice(0, 300)}`);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

/** Page tokens derived from a long-lived user token do not expire; we read the cached one. */
async function metaCreds() {
  const { data } = await admin
    .from("user_connector_tokens")
    .select("meta_defaults")
    .not("meta_defaults", "is", null)
    .limit(20);

  for (const row of data ?? []) {
    const d = (row.meta_defaults ?? {}) as Record<string, unknown>;
    const pageId = (d.page_id as string) ?? "1087872784403919";
    const igUserId = (d.ig_user_id as string) ?? "17841436891682401";
    const cache = (d.meta_page_tokens ?? {}) as Record<string, string>;
    const pageToken = cache[pageId];
    if (pageToken) return { pageToken, igUserId };
    const userToken = (d.meta_token as { access_token?: string } | undefined)?.access_token;
    if (userToken) {
      const res = await fetch(`${FB_API}/${pageId}?fields=access_token&access_token=${encodeURIComponent(userToken)}`);
      const j = (await res.json()) as { access_token?: string };
      if (j.access_token) return { pageToken: j.access_token, igUserId };
    }
  }
  throw new Error("No Meta page token available — connect Instagram via meta_me first.");
}

async function publishOne(post: Post, creds: { pageToken: string; igUserId: string }) {
  const params = new URLSearchParams({ image_url: post.image_url! });
  if (post.slot_type === "story") params.set("media_type", "STORIES");
  else params.set("caption", post.caption);

  const container = (await fb(`/${creds.igUserId}/media?${params.toString()}`, creds.pageToken, {
    method: "POST",
  })) as { id?: string };
  if (!container.id) throw new Error("media container creation failed");

  let status = "IN_PROGRESS";
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 2000 : 3000));
    const s = (await fb(`/${container.id}?fields=status_code,status`, creds.pageToken)) as {
      status_code?: string;
      status?: string;
    };
    status = s.status_code ?? "IN_PROGRESS";
    if (status === "FINISHED") break;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`media processing ${status}: ${s.status ?? ""}`);
  }
  if (status !== "FINISHED") throw new Error(`media still processing (${status})`);

  const published = (await fb(`/${creds.igUserId}/media_publish?creation_id=${container.id}`, creds.pageToken, {
    method: "POST",
  })) as { id?: string };
  return published.id ?? null;
}

async function publishDue() {
  const { data } = await admin
    .from("social_scheduled_posts")
    .select("id, scheduled_at, slot_type, caption, image_prompt, image_url, is_render, engineering_status, attempts")
    .eq("status", "ready")
    .in("engineering_status", ["pass", "skipped"])
    .not("image_url", "is", null)
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(PUBLISH_BATCH);

  const posts = (data ?? []) as Post[];
  if (!posts.length) return { published: 0 };

  let creds: { pageToken: string; igUserId: string };
  try {
    creds = await metaCreds();
  } catch (e) {
    await pause((e as Error).message);
    return { paused: true };
  }

  let published = 0;
  for (const post of posts) {
    // Claim the row so a concurrent run can never double-post it.
    const { data: claimed } = await admin
      .from("social_scheduled_posts")
      .update({ status: "publishing" })
      .eq("id", post.id)
      .eq("status", "ready")
      .select("id");
    if (!claimed?.length) continue;

    try {
      const mediaId = await publishOne(post, creds);
      await admin
        .from("social_scheduled_posts")
        .update({ status: "published", ig_media_id: mediaId, published_at: new Date().toISOString(), last_error: null })
        .eq("id", post.id);
      published++;
    } catch (e) {
      const attempts = post.attempts + 1;
      await admin
        .from("social_scheduled_posts")
        .update({
          status: attempts >= MAX_ATTEMPTS ? "failed" : "ready",
          attempts,
          last_error: (e as Error).message.slice(0, 500),
        })
        .eq("id", post.id);
    }
  }
  return { published };
}

/* --------------------------------- entry --------------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Admin-triggered actions (publish now) — require an admin JWT.
    let action: string | undefined;
    let postId: string | undefined;
    if (req.method === "POST") {
      try {
        const body = (await req.json()) as { action?: string; postId?: string };
        action = body?.action;
        postId = body?.postId;
      } catch {
        // cron calls send no body
      }
    }

    if (action === "publish_now") {
      const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
      const { data: userData } = await admin.auth.getUser(token);
      const uid = userData?.user?.id;
      if (!uid) return json({ error: "Unauthorized" }, 401);
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (isAdmin !== true) return json({ error: "Forbidden" }, 403);
      if (!postId) return json({ error: "postId required" }, 400);

      const { data: row } = await admin
        .from("social_scheduled_posts")
        .select("id, scheduled_at, slot_type, caption, image_prompt, image_url, is_render, engineering_status, attempts")
        .eq("id", postId)
        .maybeSingle();
      const post = row as Post | null;
      if (!post) return json({ error: "Post not found" }, 404);
      if (!post.image_url) return json({ error: "Creative not rendered yet" }, 400);
      if (post.slot_type === "story") return json({ error: "Stories must be posted manually" }, 400);

      let creds: { pageToken: string; igUserId: string };
      try {
        creds = await metaCreds();
      } catch (e) {
        return json({ error: (e as Error).message }, 400);
      }

      try {
        const mediaId = await publishOne(post, creds);
        await admin
          .from("social_scheduled_posts")
          .update({ status: "published", ig_media_id: mediaId, published_at: new Date().toISOString(), last_error: null })
          .eq("id", post.id);
        return json({ ok: true, published: 1, ig_media_id: mediaId });
      } catch (e) {
        const message = (e as Error).message.slice(0, 500);
        await admin.from("social_scheduled_posts").update({ last_error: message }).eq("id", post.id);
        return json({ error: message }, 500);
      }
    }

    const { data: state } = await admin
      .from("social_scheduler_state")
      .select("paused, pause_reason, lease_until")
      .eq("id", "default")
      .maybeSingle();

    if (state?.paused) {
      return json({ skipped: "paused", reason: state.pause_reason });
    }

    // Single-flight lease: a second concurrent run exits instead of duplicating work.
    const { data: leased, error: leaseErr } = await admin.rpc("claim_social_scheduler_lease", {
      p_lease_seconds: Math.round(LEASE_MS / 1000),
    });
    if (leaseErr) throw new Error(`lease failed: ${leaseErr.message}`);
    if (leased !== true) return json({ skipped: "locked" });

    const rendered = await renderDue();
    const publishedResult = rendered.paused ? { published: 0 } : await publishDue();

    await admin
      .from("social_scheduler_state")
      .update({ lease_until: null, updated_at: new Date().toISOString() })
      .eq("id", "default");

    return json({ ok: true, ...rendered, ...publishedResult });
  } catch (e) {
    console.error("social-scheduler error", e);
    await admin
      .from("social_scheduler_state")
      .update({ lease_until: null, last_error: (e as Error).message.slice(0, 500) })
      .eq("id", "default");
    return json({ error: (e as Error).message }, 500);
  }
});
