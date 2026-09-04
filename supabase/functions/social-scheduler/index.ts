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

/** One scheduled invocation lands one due creative; it never pre-renders future slots. */
const RENDER_BATCH = 1;
/** How far down the due backlog a run may walk when the first candidates fail or are rejected. */
const RENDER_CANDIDATES = 3;

/** One scheduled invocation publishes at most one post. */
const PUBLISH_BATCH = 1;
const LEASE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

/** Appended to every render prompt so the creative is manufacturable, not just pretty. */
const PRINTABILITY_CLAUSE =
  " Manufacturing constraints: a single solid monolithic form with a wide flat base sitting fully on the surface, " +
  "no floating or cantilevered elements, no thin stems or wires, no lattice or perforations, all overhangs kept under 45 degrees, " +
  "no separate accessories or props touching the piece, minimum wall thickness of 3mm, chest and neck extended forward to fully support the chin. " +
  "Fur tufts, ruffs, feathers, crests, whiskers and ears are simplified into thick solid upward-flowing masses fully merged into the head — " +
  "never thin, separated or downward-pointing strands. The mouth stays closed or barely parted with the tongue merged into the jaw, no open cavity. " +
  "The neck is broad and tapers continuously into the plinth with no narrow waist or undercut beneath the chest.";

/**
 * Each post gets its own pet so the grid reads like many real customers, not one repeated order.
 * Deterministic per post id: the same slot always re-renders with the same name.
 */
const ENGRAVINGS: Array<{ name: string; sub: string }> = [
  { name: "BAILEY", sub: "2011 — 2024" },
  { name: "MILO", sub: "GOOD BOY" },
  { name: "LUNA", sub: "2010 — 2023" },
  { name: "COOPER", sub: "ADOPTED 2021" },
  { name: "DAISY", sub: "2012 — 2025" },
  { name: "CHARLIE", sub: "OUR SUNSHINE" },
  { name: "MAX", sub: "2008 — 2022" },
  { name: "BELLA", sub: "THE BEST GIRL" },
  { name: "SADIE", sub: "DAD'S BEST FRIEND" },
  { name: "OLLIE", sub: "SOFA SUPERVISOR" },
  { name: "ROSIE", sub: "2011 — 2025" },
  { name: "DUKE", sub: "HOME SINCE 2019" },
  { name: "NALA", sub: "2016 — 2025" },
  { name: "TOBY", sub: "PROFESSIONAL NAPPER" },
  { name: "SIMBA", sub: "2012 — 2024" },
  { name: "CLEO", sub: "OUR LITTLE SHADOW" },
  { name: "PEPPER", sub: "CHIEF TROUBLEMAKER" },
  { name: "OSCAR", sub: "2009 — 2023" },
];

/**
 * The grid has to look like many different households, not one breed of dog.
 * Roughly half cats, half dogs, with a few other companion animals.
 */
const SPECIES: string[] = [
  "domestic shorthair cat",
  "golden retriever dog",
  "tabby cat",
  "labrador retriever dog",
  "maine coon cat with a full ruff",
  "beagle dog",
  "siamese cat",
  "french bulldog",
  "british shorthair cat",
  "german shepherd dog",
  "ragdoll cat",
  "dachshund dog",
  "black cat",
  "border collie dog",
  "lop-eared rabbit",
  "small parrot with a smooth rounded head and no crest",
  "shih tzu dog",
  "persian cat",
];

function hash(id: string, salt = "") {
  let h = 0;
  for (const ch of salt + id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function speciesFor(id: string) {
  return SPECIES[hash(id, "species:") % SPECIES.length];
}

/**
 * Prompts were authored dog-first. Swap whatever animal noun they name for the
 * species pinned to this slot so the feed spans cats, dogs and beyond.
 */
const SPECIES_NOUNS =
  /\b(golden retriever|labrador retriever|german shepherd|french bulldog|border collie|maine coon|british shorthair|domestic shorthair|persian cat|siamese cat|ragdoll cat|tabby cat|black cat|lop-eared rabbit|dachshund|shih tzu|beagle|puppy|kitten|dogs|cats|dog|cat|animal|pet)\b/gi;

const applySpecies = (p: string, id: string) => p.replace(SPECIES_NOUNS, speciesFor(id));

function engravingFor(id: string) {
  return ENGRAVINGS[hash(id) % ENGRAVINGS.length];
}

/** Every product render must visibly prove the piece is personalised from the customer's own photo. */
const engravingClause = (e: { name: string; sub: string }) =>
  " Personalisation: the front face of the thick flat base plinth carries RAISED EMBOSSED lettering that stands proud " +
  "of the plinth surface by about 1.2 mm — extruded 3D letters printed in the same single filament colour, never carved, " +
  "never recessed, never cut into or below the surface. Clearly legible and correctly spelled, in a small clean uppercase " +
  `sans-serif — the name "${e.name}" and beneath it a smaller line reading "${e.sub}". ` +
  "The raised letters cast their own small drop shadow onto the plinth face and show the same fine layer lines as the body. " +
  "Frame the shot so the lettered base is fully visible in the lower third and never cropped.";


/** A mix of joyful and calmly content expressions — never solemn, never grieving. */
const HAPPY_EXPRESSION =
  " Expression: warm and happy — a gentle open-mouthed smile with the tongue tip just visible, relaxed lifted cheeks, " +
  "ears perked and alert, bright uplifted brows, a joyful and alive look, all sculpted as form.";
const CALM_EXPRESSION =
  " Expression: calm and content — a soft relaxed face with gently closed or half-open mouth, a quiet alert gaze, " +
  "settled ears, a peaceful at-ease look that is warm but not solemn, all sculpted as form.";

/** Deterministic per slot: roughly half happy, half calm, never sad. */
const expressionFor = (id: string): string => {
  const h = Array.from(id).reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  return h % 2 === 0 ? HAPPY_EXPRESSION : CALM_EXPRESSION;
};

const FORMAT_CLAUSE = " Vertical 4:5 portrait framing suitable for an Instagram feed post.";

/** The piece is printed in one filament, so nothing on it can be a different colour. */
const MONOCHROME_CLAUSE =
  " Material: printed in a single filament colour — the whole piece including the eyes, pupils, nose, tongue, mouth and base " +
  "is exactly the same colour and finish as the body. No coloured irises, no wet or mirror highlights, no pink tongue, " +
  "no painted details, no two-tone or multi-colour areas anywhere; eyes and details read purely as sculpted form.";

/** Matches the product renders: a real satin PLA print, not a flat matte CG object. */
const SATIN_CLAUSE =
  " Finish: a soft satin PLA sheen photographed as a real 3D-printed object in a studio — broad gentle highlights rolling " +
  "over the curved surfaces, warm soft-box reflections, and very fine even horizontal print layer lines in the same colour " +
  "catching the light along the curves. Not glossy, not a flat matte CG render.";

/** Every edge is eased — the first physical print came back uncomfortably sharp. */
const SOFT_EDGE_CLAUSE =
  " Edges: the plinth is deep and heavy with generously rounded corners and a soft chamfer along every top and bottom edge — " +
  "no sharp knife edges anywhere, every transition eased and hand-friendly, the piece reading substantial and heavy in the hand.";

const renderPrompt = (p: string, id: string) =>
  `${applySpecies(p, id)}${engravingClause(engravingFor(id))}${expressionFor(id)}${MONOCHROME_CLAUSE}${SATIN_CLAUSE}${SOFT_EDGE_CLAUSE}${PRINTABILITY_CLAUSE}${FORMAT_CLAUSE}`;

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

const isAiCircuitPause = (reason: string | null | undefined) =>
  reason?.startsWith("AI gateway 402:") === true || reason?.startsWith("AI gateway 403:") === true;

async function clearAiPause() {
  await admin
    .from("social_scheduler_state")
    .update({ paused: false, pause_reason: null, last_error: null, updated_at: new Date().toISOString() })
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
  return (await res.json()) as {
    pass?: boolean;
    confidence?: number;
    issues?: string[];
    skipped?: boolean;
    revision_prompt?: string;
  };
}

/** Max render passes per slot in one run: the agent's revision note feeds straight back into the prompt. */
const ENGINEERING_RETRIES = 2;

/* ------------------------------ queue refill ------------------------------ */

/** Three daily posting slots in UTC — 09:00 ET (morning scroll), 12:00 ET (midday) and
 *  17:00 ET (evening unwind). Steady-state cadence: up to 3 posts/day while we build the
 *  raised-lettering content base ahead of the ad launch. */
const SLOT_HOURS_UTC = [13, 16, 21];
/** Always keep this many days of slots queued ahead so the feed never runs dry. */
const QUEUE_AHEAD_DAYS = 3;

/**
 * The original content plan was a fixed run of days; once it was exhausted the cron kept
 * firing with nothing due and posting silently stopped. Top the queue up on every run by
 * recycling the plan's captions and prompts — each new row gets a fresh id, so the species,
 * engraving and expression all differ from the slot it was cloned from.
 */
async function ensureQueue() {
  const now = Date.now();

  const { data: library } = await admin
    .from("social_scheduled_posts")
    .select("caption, image_prompt, theme, slot_type, is_render, day_index")
    .eq("slot_type", "feed")
    .order("day_index", { ascending: true })
    .order("scheduled_at", { ascending: true });

  const plan = (library ?? []) as Array<{
    caption: string;
    image_prompt: string;
    theme: string | null;
    slot_type: string;
    is_render: boolean;
    day_index: number;
  }>;
  if (!plan.length) return { queued: 0 };

  const windowEnd = new Date(now + QUEUE_AHEAD_DAYS * 86400000).toISOString();
  const { data: existingRows } = await admin
    .from("social_scheduled_posts")
    .select("scheduled_at, day_index")
    .gt("scheduled_at", new Date(now).toISOString())
    .lte("scheduled_at", windowEnd);

  const taken = new Set(
    ((existingRows ?? []) as Array<{ scheduled_at: string }>).map((r) => new Date(r.scheduled_at).toISOString()),
  );

  const { data: maxRow } = await admin
    .from("social_scheduled_posts")
    .select("day_index")
    .order("day_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextDayIndex = ((maxRow as { day_index?: number } | null)?.day_index ?? 0) + 1;

  const rows: Array<Record<string, unknown>> = [];
  for (let d = 0; d < QUEUE_AHEAD_DAYS; d++) {
    const day = new Date(now + d * 86400000);
    let dayHasNew = false;
    for (const hour of SLOT_HOURS_UTC) {
      const at = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, 0, 0));
      if (at.getTime() <= now) continue;
      const iso = at.toISOString();
      if (taken.has(iso)) continue;
      const source = plan[(rows.length + nextDayIndex * SLOT_HOURS_UTC.length) % plan.length];
      rows.push({
        scheduled_at: iso,
        slot_type: "feed",
        day_index: nextDayIndex,
        theme: source.theme,
        caption: source.caption,
        image_prompt: source.image_prompt,
        is_render: source.is_render,
        status: "scheduled",
        engineering_status: "pending",
      });
      taken.add(iso);
      dayHasNew = true;
    }
    if (dayHasNew) nextDayIndex++;
  }

  if (!rows.length) return { queued: 0 };
  const { error } = await admin.from("social_scheduled_posts").insert(rows);
  if (error) {
    console.error("queue refill failed", error.message);
    return { queued: 0 };
  }
  return { queued: rows.length };
}



async function renderDue() {
  const now = new Date().toISOString();

  // Only an agent-rejected render is unusable and worth re-rendering. Posts parked for any
  // other reason keep their generated image so an admin can still publish them manually.
  await admin
    .from("social_scheduled_posts")
    .update({ status: "scheduled", image_url: null })
    .eq("status", "needs_review")
    .eq("engineering_status", "fail")
    .lt("attempts", MAX_ATTEMPTS)
    .lte("scheduled_at", now);

  const { data } = await admin
    .from("social_scheduled_posts")
    .select("id, scheduled_at, slot_type, caption, image_prompt, image_url, is_render, engineering_status, attempts")
    .eq("status", "scheduled")
    .is("image_url", null)
    .lte("scheduled_at", now)
    .lt("attempts", MAX_ATTEMPTS)
    .order("scheduled_at", { ascending: true })
    .limit(RENDER_CANDIDATES);

  // Walk the due backlog oldest-first but stop as soon as one creative lands, so a failed
  // or rejected slot cannot silently swallow the whole run's posting capacity.
  const posts = (data ?? []) as Post[];
  let succeeded = 0;
  for (const post of posts) {
    if (succeeded >= RENDER_BATCH) break;

    let engineering: unknown = null;
    let engineering_status = "skipped";
    let imageUrl: string | null = null;
    let revision = "";
    let renderError: { status?: number; error?: string } | null = null;

    // Re-render with the engineering agent's own revision note until it passes,
    // so a rejected slot still makes its posting time.
    for (let pass = 0; pass < ENGINEERING_RETRIES; pass++) {
      const base = post.is_render ? renderPrompt(post.image_prompt, post.id) : post.image_prompt;
      const rendered = await renderImage(revision ? `${base} ${revision}` : base);
      if (!rendered.url) {
        if (rendered.status === 402 || rendered.status === 403) {
          await pause(`AI gateway ${rendered.status}: ${rendered.error ?? "blocked"}`);
          return { paused: true };
        }
        renderError = rendered;
        break;
      }
      imageUrl = rendered.url;
      // A successful probe proves the workspace can generate again.
      await clearAiPause();
      if (!post.is_render) {
        engineering_status = "skipped";
        break;
      }
      try {
        const verdict = await engineeringCheck(rendered.url, post.image_prompt);
        engineering = verdict;
        engineering_status = verdict.skipped ? "skipped" : verdict.pass === false ? "fail" : "pass";
        if (engineering_status !== "fail") break;
        revision = verdict.revision_prompt?.trim() || "Simplify the form: merge all thin details into solid masses and remove every overhang.";
      } catch (e) {
        engineering_status = "pending";
        engineering = { error: (e as Error).message };
        break;
      }
    }

    if (!imageUrl) {
      await admin
        .from("social_scheduled_posts")
        .update({ attempts: post.attempts + 1, last_error: renderError?.error ?? "render failed" })
        .eq("id", post.id);
      continue;
    }

    // A render the engineering agent rejects never auto-publishes — it parks for review.
    const status =
      engineering_status === "fail" || engineering_status === "pending" ? "needs_review" : "ready";

    await admin
      .from("social_scheduled_posts")
      .update({
        image_url: imageUrl,
        engineering,
        engineering_status,
        status,
        attempts: post.attempts + 1,
        last_error: engineering_status === "fail" ? "Engineering agent rejected this render" : null,
      })
      .eq("id", post.id);

    if (status === "ready") succeeded++;
  }
  return { rendered: succeeded };

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
  // A run killed mid-publish leaves a row claimed forever; hand it back after 10 minutes.
  await admin
    .from("social_scheduled_posts")
    .update({ status: "ready" })
    .eq("status", "publishing")
    .is("ig_media_id", null)
    .lt("updated_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

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

    const aiCircuitPaused = state?.paused === true && isAiCircuitPause(state.pause_reason);
    if (state?.paused && !aiCircuitPaused) {
      return json({ skipped: "paused", reason: state.pause_reason });
    }

    // Single-flight lease: a second concurrent run exits instead of duplicating work.
    const { data: leased, error: leaseErr } = await admin.rpc("claim_social_scheduler_lease", {
      p_lease_seconds: Math.round(LEASE_MS / 1000),
    });
    if (leaseErr) throw new Error(`lease failed: ${leaseErr.message}`);
    if (leased !== true) return json({ skipped: "locked" });

    // Keep future slots seeded so an exhausted plan can never stop the feed.
    const refill = await ensureQueue();

    // While AI is paused, one due item is the permitted recovery probe. A denied
    // probe keeps the circuit open; a successful render clears it automatically.
    const rendered = await renderDue();


    // Publishing does not consume AI credits. Always release one approved creative,
    // even when the generation probe keeps the AI circuit paused.
    const publishedResult = await publishDue();

    await admin
      .from("social_scheduler_state")
      .update({ lease_until: null, updated_at: new Date().toISOString() })
      .eq("id", "default");

    return json({
      ok: true,
      ...rendered,
      queued: refill.queued,
      published: publishedResult.published ?? 0,

      ai_paused: rendered.paused === true || (aiCircuitPaused && (rendered.rendered ?? 0) === 0),
    });
  } catch (e) {
    console.error("social-scheduler error", e);
    await admin
      .from("social_scheduler_state")
      .update({ lease_until: null, last_error: (e as Error).message.slice(0, 500) })
      .eq("id", "default");
    return json({ error: (e as Error).message }, 500);
  }
});
