import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Anonymous visitors get a handful of free renders per day, keyed by IP. */
const FREE_PREVIEWS_PER_DAY = 4;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

async function hashIp(ip: string) {
  const data = new TextEncoder().encode(`nyzora-originals:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function decodeDataUrl(dataUrl: string) {
  const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[3]), (c) => c.charCodeAt(0));
  return { mime: match[1].toLowerCase(), bytes };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) return json({ error: "AI is not configured." }, 500);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const skuSlug = String(body.skuSlug ?? "").slice(0, 80);
    const prompt = String(body.prompt ?? "").trim().slice(0, 4000);
    const personalization = (body.personalization && typeof body.personalization === "object")
      ? body.personalization
      : {};
    const sourceImage: string | undefined = typeof body.sourceImage === "string" ? body.sourceImage : undefined;
    if (!skuSlug || !prompt) return json({ error: "Missing details." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Optional identity — this flow is deliberately open to logged-out buyers.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const ipHash = await hashIp(ip);

    // Admins render unlimited previews (internal testing, content shoots).
    let unlimited = false;
    let used = 0;
    if (userId) {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
      unlimited = isAdmin === true;
    }

    if (!unlimited) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("originals_previews")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", since);
      used = count ?? 0;
      if (used >= FREE_PREVIEWS_PER_DAY) {
        return json({
          error: "You've used your free previews for today. Order a piece to keep going, or come back tomorrow.",
          code: "PREVIEW_LIMIT",
        }, 429);
      }
    }

    // Upload the buyer's photo so the model can see it (and so we keep a record).
    let sourceUrl: string | null = null;
    let sourceStoragePath: string | null = null;
    if (sourceImage) {
      const decoded = decodeDataUrl(sourceImage);
      if (!decoded) return json({ error: "Please upload a JPG, PNG or WebP photo." }, 400);
      if (decoded.bytes.byteLength > MAX_UPLOAD_BYTES) {
        return json({ error: "That photo is too large — please keep it under 8 MB." }, 400);
      }
      const ext = decoded.mime.includes("png") ? "png" : decoded.mime.includes("webp") ? "webp" : "jpg";
      const path = `source/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await admin.storage.from("originals-uploads").upload(path, decoded.bytes, {
        contentType: decoded.mime,
        upsert: false,
      });
      if (upErr) {
        console.error("source upload failed", upErr);
        return json({ error: "We couldn't read that photo. Try another one." }, 400);
      }
      sourceStoragePath = path;
      // The model receives the bytes inline (private bucket links aren't
      // fetchable by the gateway), so nothing public is ever exposed.
      sourceUrl = sourceImage.trim();
    }

    const content: unknown[] = [{ type: "text", text: prompt }];
    if (sourceUrl) content.unshift({ type: "image_url", image_url: { url: sourceUrl } });

    let previewDataUrl: string | undefined;
    for (let attempt = 1; attempt <= 2 && !previewDataUrl; attempt++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content }],
          modalities: ["image", "text"],
        }),
      });
      if (res.status === 429) return json({ error: "We're at capacity for a moment — try again shortly." }, 429);
      if (res.status === 402) return json({ error: "AI capacity unavailable. Please try again later." }, 402);
      if (!res.ok) {
        console.error("gateway error", res.status, await res.text());
        continue;
      }
      const data = await res.json();
      previewDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    }

    if (!previewDataUrl) return json({ error: "We couldn't render that one. Try a clearer, well-lit photo." }, 502);

    const decodedPreview = decodeDataUrl(previewDataUrl);
    let previewUrl = previewDataUrl;
    if (decodedPreview) {
      const path = `originals/preview/${crypto.randomUUID()}.png`;
      const { error: pErr } = await admin.storage.from("product-images").upload(path, decodedPreview.bytes, {
        contentType: decodedPreview.mime,
        upsert: false,
      });
      if (!pErr) previewUrl = admin.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }

    const { data: row } = await admin
      .from("originals_previews")
      .insert({
        user_id: userId,
        ip_hash: ipHash,
        sku_slug: skuSlug,
        personalization,
        source_image_url: sourceStoragePath,
        preview_image_url: previewUrl,
      })
      .select("id")
      .single();

    // Manufacturability runs silently in the background — the buyer never waits on it.
    if (row?.id && previewUrl.startsWith("http")) {
      (async () => {
        try {
          const eng = await fetch(`${SUPABASE_URL}/functions/v1/engineering-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              imageUrl: previewUrl,
              prompt,
              category: "Objects",
              manufacturingMethod: "fdm_us",
            }),
          });
          if (eng.ok) {
            await admin.from("originals_previews").update({ engineering: await eng.json() }).eq("id", row.id);
          }
        } catch (e) {
          console.error("engineering-check failed", e);
        }
      })();

      // The real 3D mesh + partner slice only runs once the buyer picks a size,
      // so we never spend a generation on a piece nobody is sizing up.

    }


    return json({
      previewId: row?.id ?? null,
      previewUrl,
      sourceUrl,
      remaining: unlimited ? null : Math.max(0, FREE_PREVIEWS_PER_DAY - used - 1),
    });
  } catch (e) {
    console.error("originals-preview error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
