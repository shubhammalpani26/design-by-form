import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BG_REMOVAL_MODELS = [
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-2.5-flash-image",
];

const extractImageFromResponse = (data: any): string | null => {
  const message = data?.choices?.[0]?.message;

  const directImage = message?.images?.[0]?.image_url?.url;
  if (typeof directImage === "string" && directImage.length > 0) {
    return directImage;
  }

  const b64Image = message?.images?.[0]?.b64_json;
  if (typeof b64Image === "string" && b64Image.length > 0) {
    return `data:image/png;base64,${b64Image}`;
  }

  const content = message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const partUrl = part?.image_url?.url;
      if (typeof partUrl === "string" && partUrl.length > 0) {
        return partUrl;
      }
    }
  }

  if (typeof content === "string") {
    const dataUrlMatch = content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    if (dataUrlMatch?.[0]) {
      return dataUrlMatch[0];
    }
  }

  return null;
};

const callBackgroundRemovalModel = async (
  model: string,
  imageUrl: string,
  prompt: string,
  apiKey: string,
) => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  return response;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Remove the background from this furniture/product image completely. Return ONLY a PNG image with a true transparent alpha channel. Do not return text. Do not keep any white or colored backdrop. Remove all shadows, floor planes, halos, fringes, and artifacts. Preserve the furniture shape, texture, and colors exactly.`;

    console.log("Removing background with AI...");

    let lastError: string | null = null;

    for (const model of BG_REMOVAL_MODELS) {
      const response = await callBackgroundRemovalModel(model, imageUrl, prompt, LOVABLE_API_KEY);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const errorText = await response.text();
        console.error(`AI gateway error (${model}):`, response.status, errorText);
        lastError = `AI gateway error (${model}): ${response.status}`;
        continue;
      }

      const data = await response.json();
      const generatedImage = extractImageFromResponse(data);

      if (generatedImage) {
        console.log(`Background removed successfully with model: ${model}`);
        return new Response(
          JSON.stringify({ imageUrl: generatedImage }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error(`No image in AI response for model ${model}:`, JSON.stringify(data).slice(0, 700));
      lastError = `Model ${model} did not return an image`;
    }

    throw new Error(lastError || "AI did not return a processed image");
  } catch (error) {
    console.error("Error removing background:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to remove background" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
