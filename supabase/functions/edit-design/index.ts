import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MANUFACTURING_CONSTRAINTS = `CRITICAL MANUFACTURING CONSTRAINTS (non-negotiable):
- Solid, monolithic forms only. NO lattice, perforations, mesh, filigree, or open cellular structures.
- Flat, stable base that sits flush on the floor.
- One cohesive tonal palette (1-2 closely related tones + at most one small accent material).
- Manufacturable via solid wood joinery, upholstery on solid frames, metalwork, stone, or sculpted resin/composite.
- Maintain the same furniture category, overall silhouette, and core proportions as the source image unless the user explicitly requests a category/silhouette change.
- If the user's edit is vague (e.g. "make it bigger", "can't see it", "show better"), treat it as a framing/quality request and KEEP the exact same piece — do not change its type, form, or materials.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth: require a logged-in user. In Edge Functions there is no browser
    // auth storage, so pass the bearer token directly to getUser().
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const baseImageUrl: string = body.baseImageUrl;
    const editPrompt: string = (body.editPrompt ?? "").toString().trim();
    const sessionId: string | undefined = body.sessionId;
    const category: string | undefined = body.category;
    const originalPrompt: string = (body.originalPrompt ?? "").toString().trim().slice(0, 800);
    const priorEdits: string[] = Array.isArray(body.priorEdits)
      ? body.priorEdits.slice(-6).map((s: unknown) => String(s ?? "").trim()).filter(Boolean)
      : [];

    if (!baseImageUrl || !editPrompt) {
      return new Response(JSON.stringify({ error: "baseImageUrl and editPrompt are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (editPrompt.length > 4000) {
      return new Response(JSON.stringify({ error: "editPrompt too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // If sessionId provided, verify it belongs to this user
    if (sessionId) {
      const { data: sess, error: sErr } = await admin
        .from("design_sessions")
        .select("id,user_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (sErr || !sess || sess.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const sessionContextBlock = [
      originalPrompt ? `ORIGINAL DESIGN BRIEF (the piece in the reference image was created from this prompt — preserve its essence):\n"${originalPrompt}"` : "",
      priorEdits.length ? `PRIOR REFINEMENTS the user already requested (in order):\n${priorEdits.map((e, i) => `${i + 1}. ${e}`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    const systemText = `You are a world-class furniture designer and product photographer.
You are iterating on a single ongoing design with a creator. You will receive the current reference image of the piece plus their next instruction.
Produce a single photorealistic product photograph that applies the requested edit while preserving the design intent across the whole session.

${MANUFACTURING_CONSTRAINTS}

${sessionContextBlock || (category ? `Category hint: ${category}` : "")}

Rules for this turn:
- The reference image is the source of truth for the piece. Never substitute it for a different product type (e.g. don't turn a lamp into a chair) unless the user EXPLICITLY says "make it a <new type>".
- Apply only the new instruction below, on top of the existing piece and the prior refinements.
- Output a clean studio product photograph on a neutral backdrop — no room context, no people, no text overlays.`;

    const userInstruction = `Next instruction from the creator: ${editPrompt}`;

    console.log("edit-design: generating with prompt:", editPrompt.slice(0, 120));

    // Call Gemini image model with image input
    let newImageDataUrl: string | null = null;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          modalities: ["image", "text"],
          messages: [
            { role: "system", content: systemText },
            {
              role: "user",
              content: [
                { type: "text", text: userInstruction },
                { type: "image_url", image_url: { url: baseImageUrl } },
              ],
            },
          ],
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.error("AI gateway error", resp.status, t.slice(0, 300));
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit hit. Try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits depleted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (attempt === maxRetries) {
          return new Response(JSON.stringify({ error: "Edit failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        continue;
      }

      const data = await resp.json();
      newImageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      if (newImageDataUrl) break;
      console.warn(`edit-design: no image in response (attempt ${attempt})`);
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 800));
    }

    if (!newImageDataUrl) {
      return new Response(JSON.stringify({ error: "No image returned by model" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to product-images bucket (never store base64 in DB per project memory)
    let publicUrl = newImageDataUrl;
    const match = newImageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (match) {
      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const binaryString = atob(match[2]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const filePath = `studio-sessions/${userId}/${sessionId ?? "ad-hoc"}/${Date.now()}.${ext}`;
      const { error: upErr } = await admin.storage.from("product-images").upload(filePath, bytes, {
        contentType: `image/${match[1]}`,
        upsert: false,
      });
      if (upErr) {
        console.error("Upload error:", upErr);
      } else {
        const { data: urlData } = admin.storage.from("product-images").getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }
    }

    return new Response(JSON.stringify({ imageUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("edit-design error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});