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

/** Same palette as the storefront — keys must stay in sync with src/lib/originalsColors.ts. */
const COLOR_PROMPTS: Record<string, string> = {
  bone: "warm bone white",
  charcoal: "deep charcoal black",
  marble: "pale speckled marble grey",
  slate: "cool slate grey",
  sand: "soft sand tan",
  blush: "muted blush pink",
};

function buildPrompt(p: Record<string, unknown>) {
  const heading = String(p.heading ?? p.petName ?? "").trim().toUpperCase();
  const footnote = String(p.footnote ?? "").trim().toUpperCase();
  const breed = String(p.breed ?? p.petType ?? "").trim();
  const colorKey = String(p.color ?? "bone").trim();
  const colour = COLOR_PROMPTS[colorKey] ?? COLOR_PROMPTS.bone;

  const lettering = heading
    ? `the front face of the plinth carries the raised name "${heading}"${
      footnote ? ` with "${footnote}" raised on a second line below it` : ""
    }, standing proud of the surface in the same single colour as the rest of the piece, crisp and legible, and nothing whatsoever on the top of the plinth.`
    : "the plinth is left completely bare, with no lettering anywhere on it.";

  return (
    `Using the animal in the reference photo, create a fully three-dimensional FDM-printed PLA bust of that exact animal${
      breed ? ` (${breed})` : ""
    }'s head and shoulders, keeping its recognisable face, breed, ear shape, muzzle length and markings as modelled form. ` +
    "Sculpt the animal only — never reproduce anything it is holding or wearing in the photo: no stick, ball, toy, flower, rope, food, leash, collar, tag, harness or bandana, and no hands, background objects or other animals. " +
    "Three-quarter view, rounded modelled volume front to back — absolutely not a flat silhouette, not an extruded profile plate, not a relief panel. " +
    `The entire piece is printed in one uniform ${colour} satin PLA filament — one solid material throughout, sculpture and plinth exactly the same colour, no two-tone, no gradient, no contrasting base, no paint or metallic accents. ` +
    "This is a photograph of a real FDM 3D print: fine, regular horizontal layer lines wrap every curved surface and the plinth, clearly visible and catching broad soft-box highlights with a subtle satin PLA sheen. " +
    "Do not smooth the surface into carved stone, ceramic, resin, wax, marble, plaster or a soft matte CG render — the print texture must read plainly in the image. " +
    "The expression is warm and alive: relaxed lifted cheeks, ears alert, bright brows. The eyes are sculpted, not painted: deep almond sockets with defined lids and a raised iris dome — no glass, inserts, glossy beads, paint or fine whiskers. " +
    "The shoulders flow directly into one compact deep rectangular plinth through a broad tapered, softly filleted transition — one continuous object, no separate slab, seam, gap, round pedestal or narrow neck; centre the bust over the plinth and slightly toward its front. " +
    `Keep a straight flat front lettering band with generously rounded corners and soft chamfers on every outer edge — ${lettering} ` +
    "Monolithic and solid, one continuous part, flat stable base, studio lighting on a clean neutral background showing depth, layer texture and shadow."
  );
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

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Admin only — this spends a generation and overwrites a customer-facing render.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (isAdmin !== true) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => null);
    const orderId = String(body?.orderId ?? "").trim();
    if (!orderId) return json({ error: "Missing orderId." }, 400);

    const { data: order, error: oErr } = await admin
      .from("originals_orders")
      .select("id, preview_id, personalization")
      .eq("id", orderId)
      .maybeSingle();
    if (oErr || !order) return json({ error: "Order not found." }, 404);
    if (!order.preview_id) return json({ error: "This order has no render to rebuild." }, 400);

    const { data: preview } = await admin
      .from("originals_previews")
      .select("id, source_image_url, personalization")
      .eq("id", order.preview_id)
      .maybeSingle();
    if (!preview?.source_image_url) return json({ error: "The original photo is no longer available." }, 400);

    const { data: file, error: dErr } = await admin.storage
      .from("originals-uploads")
      .download(preview.source_image_url);
    if (dErr || !file) return json({ error: "Could not read the original photo." }, 400);
    const srcBytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < srcBytes.length; i += 0x8000) {
      binary += String.fromCharCode(...srcBytes.subarray(i, i + 0x8000));
    }
    const srcMime = preview.source_image_url.endsWith(".png")
      ? "image/png"
      : preview.source_image_url.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
    const sourceDataUrl = `data:${srcMime};base64,${btoa(binary)}`;

    const personalization = {
      ...(preview.personalization as Record<string, unknown> ?? {}),
      ...(order.personalization as Record<string, unknown> ?? {}),
    };
    const prompt = buildPrompt(personalization);

    let previewDataUrl: string | undefined;
    const MODELS = ["google/gemini-3-pro-image-preview", "google/gemini-2.5-flash-image"];
    for (let attempt = 0; attempt < MODELS.length && !previewDataUrl; attempt++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODELS[attempt],
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: sourceDataUrl } },
              { type: "text", text: prompt },
            ],
          }],
          modalities: ["image", "text"],
        }),
      });
      if (!res.ok) {
        console.error("gateway error", MODELS[attempt], res.status, (await res.text()).slice(0, 300));
        continue;
      }
      const data = await res.json();
      previewDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    }
    if (!previewDataUrl) return json({ error: "The render didn't come back. Try again." }, 502);

    const decoded = decodeDataUrl(previewDataUrl);
    if (!decoded) return json({ error: "The render came back unreadable." }, 502);
    const path = `originals/preview/${crypto.randomUUID()}.png`;
    const { error: upErr } = await admin.storage
      .from("product-images")
      .upload(path, decoded.bytes, { contentType: decoded.mime, upsert: false });
    if (upErr) return json({ error: "Could not store the render." }, 500);
    const publicUrl = admin.storage.from("product-images").getPublicUrl(path).data.publicUrl;

    await admin.from("originals_previews").update({ preview_image_url: publicUrl }).eq("id", preview.id);
    await admin.from("originals_orders").update({ preview_image_url: publicUrl }).eq("id", orderId);

    return json({ ok: true, previewUrl: publicUrl });
  } catch (e) {
    console.error("admin-regenerate-render error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
