import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH GATE ---
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Sign in to generate space previews.", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sign in to generate space previews.", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { spaceImageBase64, productImageUrl, productName, category } = await req.json();

    if (!spaceImageBase64 || !productImageUrl) {
      return new Response(
        JSON.stringify({ error: "Both space image and product image are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // --- CREDIT GATE: 1 credit per space preview, pre-deducted with refund on failure ---
    const { data: creditRow, error: cErr } = await admin
      .from("user_credits").select("balance").eq("user_id", userId).maybeSingle();
    if (cErr) {
      return new Response(JSON.stringify({ error: "Could not verify credit balance." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const preBalance = creditRow?.balance ?? 0;
    if (preBalance < 1) {
      return new Response(JSON.stringify({
        error: "You're out of AI credits. Top up to keep generating space previews.",
        code: "INSUFFICIENT_CREDITS", balance: preBalance,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("user_credits")
      .update({ balance: preBalance - 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    await admin.from("credit_transactions").insert({
      user_id: userId, amount: -1, type: "usage",
      description: "AI space preview generation",
      metadata: { productName: productName ?? null, category: category ?? null },
    });
    const refundCredit = async (reason: string) => {
      await admin.from("user_credits")
        .update({ balance: preBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      await admin.from("credit_transactions").insert({
        user_id: userId, amount: 1, type: "refund",
        description: `Refund: ${reason}`,
      });
    };

    const prompt = `Take this furniture piece "${productName || 'furniture'}" (a ${category || 'furniture item'}) and place it realistically into this room/space photo. 
Make it look natural and properly scaled - as if a professional interior photographer took the photo. 
Match the lighting, shadows, and perspective of the room. 
The furniture should look like it genuinely belongs in the space.
Keep the room exactly as-is, only add the furniture piece in a natural position.`;

    // Build content array with both images
    const content: any[] = [
      { type: "text", text: prompt },
      {
        type: "image_url",
        image_url: { url: spaceImageBase64 }
      },
    ];

    // Handle product image - could be base64 or URL
    if (productImageUrl.startsWith("data:")) {
      content.push({
        type: "image_url",
        image_url: { url: productImageUrl }
      });
    } else {
      content.push({
        type: "image_url",
        image_url: { url: productImageUrl }
      });
    }

    console.log("Generating space preview with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        await refundCredit("rate-limited");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        await refundCredit("ai-credits-exhausted");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      await refundCredit("ai-gateway-error");
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in AI response:", JSON.stringify(data).slice(0, 500));
      await refundCredit("no-image-returned");
      throw new Error("AI did not generate an image");
    }

    console.log("Space preview generated successfully");

    return new Response(
      JSON.stringify({ imageUrl: generatedImage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating space preview:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate space preview" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
