import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        model: "google/gemini-2.5-flash-image",
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in AI response:", JSON.stringify(data).slice(0, 500));
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
