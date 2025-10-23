import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const generateDesignSchema = z.object({
  prompt: z.string().trim().max(2000).optional(),
  variationNumber: z.number().int().min(1).max(10).optional().default(1),
  roomImageBase64: z.string().optional(),
  sketchImageBase64: z.string().optional(), // User's uploaded sketch
  generate3D: z.boolean().optional().default(false),
  imageUrl: z.string().optional(), // For generating 3D from existing image
}).refine(
  (data) => {
    // For 3D-only generation (converting existing 2D to 3D)
    if (data.generate3D && data.imageUrl) {
      return true;
    }
    // For 2D generation (with optional 3D after), need prompt or sketch
    if (!data.generate3D || !data.imageUrl) {
      return (data.prompt && data.prompt.length >= 10) || !!data.sketchImageBase64;
    }
    return false;
  },
  {
    message: "Either prompt (min 10 chars) or sketch is required for 2D generation, or imageUrl for 3D-only generation",
  }
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT from the authorization header
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    // Create Supabase client with the auth header
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { 
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    });

    // Try to get the user - this will work if they're authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Authenticated user:', user?.id || 'anonymous');

    const requestData = await req.json();
    
    const validatedData = generateDesignSchema.parse(requestData);
    const { prompt, variationNumber, roomImageBase64, sketchImageBase64, generate3D, imageUrl: existingImageUrl } = validatedData;
    console.log("Received prompt:", prompt, "Variation:", variationNumber, "Has room image:", !!roomImageBase64, "Has sketch:", !!sketchImageBase64, "Generate 3D:", generate3D, "Has existing image:", !!existingImageUrl);

    // If generating 3D from existing image, skip image generation
    if (generate3D && existingImageUrl) {
      console.log("Generating 3D model from existing image");
      let modelUrl = null;
      const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY');
      
      if (!MESHY_API_KEY) {
        return new Response(
          JSON.stringify({ error: "3D generation not configured" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        console.log("Starting 3D model generation with Meshy");
        
        const meshyResponse = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MESHY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: existingImageUrl,
            enable_pbr: true,
            ai_model: "meshy-4",
          }),
        });

        if (meshyResponse.ok) {
          const meshyData = await meshyResponse.json();
          const taskId = meshyData.result;
          console.log("Meshy task created:", taskId);
          
          // Return immediately with task ID - let client poll for status
          return new Response(
            JSON.stringify({ 
              imageUrl: existingImageUrl,
              taskId: taskId,
              has3DSupport: true,
              polling: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.error("Failed to start Meshy task:", await meshyResponse.text());
        }
      } catch (error) {
        console.error("Error generating 3D model:", error);
      }

      return new Response(
        JSON.stringify({ 
          imageUrl: existingImageUrl,
          has3DSupport: false,
          error: "Failed to start 3D generation"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate prompt only if not generating 3D from existing image and no sketch provided
    if (!generate3D && !sketchImageBase64 && (!prompt || prompt.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: "Prompt or sketch is required for image generation" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create variations by adding different style hints
    const variationHints = [
      "Focus on bold, sculptural forms with dramatic curves",
      "Emphasize minimalist elegance with refined proportions", 
      "Create organic, flowing lines with nature-inspired shapes"
    ];

    // Build message content based on whether room image or sketch is provided
    let messages: any[];
    
    if (sketchImageBase64) {
      // Sketch-based generation
      const sketchPrompt = `Based on this sketch/reference image, create a refined, photorealistic furniture design. Style variation: ${variationHints[variationNumber - 1] || variationHints[0]}

${prompt || 'Improve and refine this design'}

Create a single beautiful furniture design shown from a 3/4 view with professional lighting on a clean white background. The design should be elegant, manufacturable, and suitable for 3D printing.`;

      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: sketchPrompt },
          { type: 'image_url', image_url: { url: sketchImageBase64 } }
        ]
      }];
    } else if (roomImageBase64) {
      // Room-aware generation with multimodal input
      const roomAwarePrompt = `Design a photorealistic furniture piece. Style variation: ${variationHints[variationNumber - 1] || variationHints[0]}

${prompt}

Create a single beautiful furniture design shown from a 3/4 view with professional lighting on a clean white background. The design should be elegant, manufacturable, and suitable for 3D printing.`;

      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: roomAwarePrompt },
          { type: 'image_url', image_url: { url: roomImageBase64 } }
        ]
      }];
    } else {
      // Standard generation without room context
      const refinedPrompt = `Design a photorealistic furniture piece. Style variation: ${variationHints[variationNumber - 1] || variationHints[0]}

${prompt}

Create a single beautiful furniture design shown from a 3/4 view with professional lighting on a clean white background. The design should be elegant, manufacturable, and suitable for 3D printing.`;

      messages = [{ role: 'user', content: refinedPrompt }];
    }

    console.log("Generating image with", sketchImageBase64 ? "sketch reference" : roomImageBase64 ? "room-aware" : "standard", "prompt");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: messages,
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate design" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze design for pricing using Aarav's expertise
    let pricingData = {
      basePrice: 9000, // Default fallback - more competitive
      complexity: 'medium',
      pricePerCubicFoot: 9000,
      reasoning: 'Standard furniture piece'
    };

    try {
      console.log("Analyzing design for pricing with Aarav");
      
      const pricingPrompt = `You are Aarav, the Master Maker and AI craftsman. Analyze this furniture design and provide competitive pricing.

Design Prompt: ${prompt}

Analyze this furniture piece and determine:
1. Manufacturing complexity (simple/medium/high)
2. Material requirements (single PP / PP + one add-on / multi-material)
3. Finishing type (matte single-color / dual-finish texture / gloss metallic hand-polished)
4. Customization level (minimal / moderate / fully bespoke)
5. Assembly difficulty (single piece / modular / multi-part)

Based on your analysis, provide a COMPETITIVE price per cubic foot between ₹6,000 and ₹18,000.
We aim to be the most competitive option in the market while maintaining quality.

IMPORTANT: For small decor items (planters, vases, bowls, shelves under 18"), use LOWER pricing (₹6,000-9,000/ft³) as these are smaller items with less material.

Decision Framework:
- Low Complexity (₹6,000-9,000/ft³): Simple forms, single material PP, matte/single-color, minimal custom, basic craft, single piece, SMALL DECOR ITEMS (planters, vases, bowls)
- Medium Complexity (₹10,000-14,000/ft³): Curved/organic, PP + one add-on, dual-finish/texture, moderate custom, modular
- High Complexity (₹15,000-18,000/ft³): Sculptural/intricate, multi-material, gloss/hand-polished/metallic, fully bespoke, intensive handwork, multi-part

Respond ONLY in valid JSON format (no markdown):
{
  "complexity": "low|medium|high",
  "pricePerCubicFoot": number,
  "reasoning": "brief explanation of pricing factors"
}`;

      const pricingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: pricingPrompt }],
          response_format: { type: 'json_object' }
        }),
      });

      if (pricingResponse.ok) {
        const pricingResult = await pricingResponse.json();
        const content = pricingResult.choices?.[0]?.message?.content;
        
        if (content) {
          const parsed = JSON.parse(content);
          pricingData = {
            basePrice: Math.max(6000, Math.min(18000, parsed.pricePerCubicFoot || 9000)),
            complexity: parsed.complexity || 'medium',
            pricePerCubicFoot: Math.max(6000, Math.min(18000, parsed.pricePerCubicFoot || 9000)),
            reasoning: parsed.reasoning || 'AI-analyzed competitive pricing'
          };
          console.log("Pricing analysis complete:", pricingData);
        }
      }
    } catch (pricingError) {
      console.error("Error analyzing pricing:", pricingError);
      // Continue with default pricing
    }

    // Generate 3D model from the 2D image using Meshy (only if requested)
    let taskId = null;
    const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY');
    
    if (MESHY_API_KEY && generate3D) {
      try {
        console.log("Starting 3D model generation with Meshy");
        
        // Create 3D generation task using image-to-3D
        const meshyResponse = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MESHY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: imageUrl,
            enable_pbr: true,
            ai_model: "meshy-4",
          }),
        });

        if (meshyResponse.ok) {
          const meshyData = await meshyResponse.json();
          taskId = meshyData.result;
          console.log("Meshy task created:", taskId);
        } else {
          console.error("Failed to start Meshy task:", await meshyResponse.text());
        }
      } catch (meshyError) {
        console.error("Error generating 3D model:", meshyError);
      }
    } else {
      console.log("MESHY_API_KEY not configured, skipping 3D generation");
    }

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        taskId: taskId,
        has3DSupport: !!taskId,
        polling: !!taskId,
        pricing: pricingData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-design function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
