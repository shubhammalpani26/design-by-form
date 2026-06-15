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
  prompt: z.string().trim().max(10000).optional(), // Allow longer prompts for detailed descriptions
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

    // Require an authenticated user. Anonymous calls are no longer accepted —
    // generate-design is now either invoked by an authed user OR by orchestrate-design
    // (which passes the user's auth header through).
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Sign in to generate designs.",
          code: "AUTH_REQUIRED",
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            enable_pbr: false, // Disable PBR for faster generation
            ai_model: "meshy-6",
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
          const errorText = await meshyResponse.text();
          console.error("Failed to start Meshy task:", errorText);
          
          let errorMessage = "Failed to start 3D generation";
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // If parsing fails, use the raw error text
            errorMessage = errorText || errorMessage;
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              has3DSupport: false
            }),
            { status: meshyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error("Error generating 3D model:", error);
        return new Response(
          JSON.stringify({ 
            error: error instanceof Error ? error.message : "3D generation failed",
            has3DSupport: false
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
      "Focus on bold, sculptural forms with dramatic curves and commanding presence",
      "Emphasize minimalist elegance with refined proportions and subtle tension", 
      "Create organic, flowing lines inspired by natural geological or botanical forms"
    ];

    // Manufacturing capabilities — Nyzora now supports BOTH advanced 3D printing
    // AND traditional craft manufacturing (via Beni Enterprises and our maker network).
    // The AI should design freely across the full furniture spectrum.
    const manufacturingConstraints = `
MANUFACTURING CAPABILITIES — Nyzora's maker network can produce a wide range of furniture:

1. LARGE-FORMAT 3D PRINTING (resin/composite): best for sculptural, organic, monolithic forms,
   curved seating, decor objects, lighting, planters, and statement pieces.
2. TRADITIONAL WOODWORKING & JOINERY: solid wood, veneers, plywood, MDF — for tables, chairs,
   beds, cabinets, shelving, consoles, sideboards. Mortise & tenon, dovetail, dowel joints are all fair game.
3. UPHOLSTERY: sofas, lounge chairs, ottomans, headboards, benches with fabric/leather/boucle,
   with foam/feather/spring cores and hardwood or metal frames.
4. METALWORK: powder-coated steel, brushed brass, blackened iron, stainless — for legs, frames,
   structural elements, hairpin/sled/cantilever bases.
5. UPHOLSTERED + WOOD + METAL HYBRIDS: multi-material assemblies are fully supported.
6. HARDWARE: hinges, soft-close drawers, sliding doors, casters/wheels, adjustable shelves,
   extension mechanisms (for dining tables), reclining mechanisms — all available through our maker network.
7. SURFACE FINISHES: stained/oiled/lacquered wood, matte/gloss paint, veneer, marble/stone tops,
   glass, rattan/cane weaving, fluting, channel tufting, piping.

DESIGN FREEDOM:
- Design for the form the piece WANTS to take — don't force every piece to be a monolithic blob.
- A dining table can have four legs and a wood top. A wardrobe can have hinged doors and drawers.
  A sofa can be upholstered. A bar cart can have wheels.
- Match the manufacturing method to the design: organic/sculptural → 3D printed; functional/storage/seating
  → traditional craft; statement decor → either.

BASELINE QUALITY RULES (apply to everything):
- Structurally sound and able to support its intended load.
- Stable, well-proportioned base / footprint.
- Real-world manufacturable at furniture scale by skilled makers.
- Cohesive material story — materials chosen should make sense together.`;

    // ─────────────────────────────────────────────────────────────
    // 🌀 MANUFACTURING INTELLIGENCE FLYWHEEL
    // Pull the most relevant learnings from completed orders so each new
    // design generation builds on real production data.
    // ─────────────────────────────────────────────────────────────
    let learningsBlock = '';
    let miContext: any = { totalSignals: 0, used: 0 };
    try {
      // Cheap heuristic to bias retrieval toward this prompt's category
      const promptLower = (prompt || '').toLowerCase();
      const categoryHints = [
        'sofa', 'chair', 'lounger', 'bench', 'table', 'dining', 'coffee',
        'lamp', 'lighting', 'painting', 'canvas', 'shelf', 'console',
      ];
      const matchedHint = categoryHints.find((c) => promptLower.includes(c));

      const { count: totalSignals } = await supabase
        .from('manufacturing_intelligence')
        .select('id', { count: 'exact', head: true });

      // First try category-biased retrieval
      let learnings: any[] = [];
      if (matchedHint) {
        const { data: biased } = await supabase
          .from('manufacturing_intelligence')
          .select('stage, signal, value, learning, maker, process, category, confidence')
          .or(`category.ilike.%${matchedHint}%,signal.ilike.%${matchedHint}%,product_name.ilike.%${matchedHint}%`)
          .order('confidence', { ascending: false })
          .limit(8);
        learnings = biased ?? [];
      }
      // Fallback / top-up with highest-confidence cross-category learnings
      if (learnings.length < 8) {
        const { data: topUp } = await supabase
          .from('manufacturing_intelligence')
          .select('stage, signal, value, learning, maker, process, category, confidence')
          .order('confidence', { ascending: false })
          .limit(8 - learnings.length);
        learnings = [...learnings, ...(topUp ?? [])];
      }

      miContext = { totalSignals: totalSignals ?? 0, used: learnings.length };

      if (learnings.length > 0) {
        learningsBlock = `
MANUFACTURING INTELLIGENCE — LEARNED FROM ${totalSignals} REAL PRODUCTION SIGNALS:
The system has built ${totalSignals} data points across completed orders. The most relevant lessons for this design:
${learnings
  .map((l, i) => `${i + 1}. [${l.maker} • ${l.process}] ${l.signal}: ${l.value}. → Lesson: ${l.learning} (confidence ${l.confidence}%).`)
  .join('\n')}

DESIGN DIRECTIVE: Honor these production-validated lessons. Choose proportions, wall thickness, base footprint, and form complexity that align with what has actually built successfully in past orders.`;
        console.log(`Flywheel: injected ${learnings.length} learnings of ${totalSignals} total signals${matchedHint ? ` (biased: ${matchedHint})` : ''}`);
      } else {
        console.log('Flywheel: no learnings yet, skipping injection');
      }
    } catch (miError) {
      console.error('Flywheel retrieval failed (continuing):', miError);
    }

    // Photography direction for premium output
    const photographyDirection = `
PHOTOGRAPHY & RENDERING STYLE — this must look like a real product photo:
- Photorealistic studio photograph, NOT a 3D render or illustration or cartoon
- Shot on a medium-format camera with shallow depth of field
- Professional product photography lighting: key light from upper-left, soft fill, subtle rim light
- Clean, neutral backdrop (light grey seamless paper or concrete floor)
- Subtle contact shadows and ambient occlusion grounding the piece
- Material should read as real: show surface texture, subtle reflections, material grain
- The furniture must look like it physically exists — real weight, real presence
- Color palette: sophisticated and muted — think concrete grey, warm sand, matte black, ivory, terracotta
- NO flat colors, NO plastic-looking surfaces, NO CGI/video-game aesthetic
- Reference aesthetic: Zaha Hadid Design, Ross Lovegrove, Neri Oxman furniture pieces`;

    // Build message content based on whether room image or sketch is provided
    let messages: any[];
    
    if (sketchImageBase64) {
      const sketchPrompt = `You are a world-class furniture designer and product photographer. Based on this sketch/reference image, create a refined, photorealistic furniture design.

Style direction: ${variationHints[variationNumber - 1] || variationHints[0]}

${prompt || 'Refine and elevate this design into a premium, gallery-worthy furniture piece'}

${manufacturingConstraints}

${learningsBlock}

${photographyDirection}

Generate a single photorealistic product photograph of this furniture piece.`;

      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: sketchPrompt },
          { type: 'image_url', image_url: { url: sketchImageBase64 } }
        ]
      }];
    } else if (roomImageBase64) {
      const roomAwarePrompt = `You are a world-class furniture designer and product photographer. Design a photorealistic furniture piece that would complement this space.

Style direction: ${variationHints[variationNumber - 1] || variationHints[0]}

${prompt}

${manufacturingConstraints}

${learningsBlock}

${photographyDirection}

Generate a single photorealistic product photograph of this furniture piece — shown on its own against a clean backdrop, NOT placed in the room.`;

      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: roomAwarePrompt },
          { type: 'image_url', image_url: { url: roomImageBase64 } }
        ]
      }];
    } else {
      const refinedPrompt = `You are a world-class furniture designer and product photographer. Design a photorealistic furniture piece.

Style direction: ${variationHints[variationNumber - 1] || variationHints[0]}

${prompt}

${manufacturingConstraints}

${learningsBlock}

${photographyDirection}

Generate a single photorealistic product photograph of this furniture piece.`;

      messages = [{ role: 'user', content: refinedPrompt }];
    }

    console.log("Generating image with", sketchImageBase64 ? "sketch reference" : roomImageBase64 ? "room-aware" : "standard", "prompt");

    // Retry logic for image generation (sometimes model returns text without image)
    let imageUrl: string | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Image generation attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
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

        // For other errors, retry
        if (attempt < maxRetries) {
          console.log(`Retrying after error...`);
          continue;
        }

        return new Response(
          JSON.stringify({ error: "Failed to generate design" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log("AI response received");

      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageUrl) {
        console.log("Image generated successfully on attempt", attempt);
        break;
      }
      
      console.warn(`No image in response (attempt ${attempt}):`, data.choices?.[0]?.message?.content?.substring(0, 100));
      
      if (attempt < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!imageUrl) {
      console.error("Failed to generate image after all retries");
      return new Response(
        JSON.stringify({ error: "Image generation failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze design for pricing using Aarav's expertise
    let pricingData = {
      basePrice: 12000, // Default fallback - premium range
      complexity: 'medium',
      pricePerCubicFoot: 12000,
      reasoning: 'Premium designer furniture'
    };

    try {
      console.log("Analyzing design for pricing with Aarav");
      
      const pricingPrompt = `You are Aarav, the Master Maker and AI craftsman for premium designer furniture. Analyze this furniture design and provide pricing.

Design Prompt: ${prompt}

This is PREMIUM DESIGNER FURNITURE — handcrafted unique pieces. Our maker network covers BOTH
advanced large-format 3D printing AND traditional craft (wood joinery, upholstery, metalwork,
multi-material assemblies, hardware like hinges/drawers/wheels).

Analyze this furniture piece and determine:
1. Likely manufacturing method (3D printed / solid wood / upholstered / metal / hybrid)
2. Manufacturing complexity (simple/medium/high)
3. Material requirements (single material / two materials / multi-material with hardware)
4. Finishing type (matte/standard / mid-tier finish / premium hand-finished, marble, brass, leather, etc.)
5. Customization level (minimal / moderate / fully bespoke)
6. Assembly difficulty (single piece / modular / multi-part with hardware)

Based on your analysis, provide a PREMIUM price per cubic foot between ₹8,000 and ₹18,000.

Decision Framework:
- Low Complexity (₹8,000-10,000/ft³): Simple forms, single material PP, matte/single-color finish, minimal customization
- Medium Complexity (₹11,000-14,000/ft³): Curved/organic shapes, PP + one add-on, dual-finish/texture, moderate custom
- High Complexity (₹15,000-18,000/ft³): Sculptural/intricate, multi-material, gloss/hand-polished/metallic, fully bespoke

IMPORTANT: 
- Small decor items (planters, vases, bowls) still use these rates but with smaller volume
- Benches and large installations should lean toward higher complexity pricing
- These prices reflect premium artisan craftsmanship

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
            basePrice: Math.max(8000, Math.min(18000, parsed.pricePerCubicFoot || 12000)),
            complexity: parsed.complexity || 'medium',
            pricePerCubicFoot: Math.max(8000, Math.min(18000, parsed.pricePerCubicFoot || 12000)),
            reasoning: parsed.reasoning || 'AI-analyzed premium pricing'
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
            enable_pbr: false, // Disable PBR for faster generation
            ai_model: "meshy-6",
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

    // ─────────────────────────────────────────────────────────────
    // 🌀 FLYWHEEL — log this generation back into the dataset
    // so future designs see this signal too. Best-effort, never blocking.
    // ─────────────────────────────────────────────────────────────
    try {
      await supabase.from('manufacturing_intelligence').insert({
        product_name: (prompt || 'Untitled design').slice(0, 80),
        creator_name: user?.email ?? 'anonymous',
        maker: 'pending-routing',
        process: 'design_generation',
        category: pricingData.complexity,
        stage: 'design_input',
        signal: 'New design generated with flywheel context',
        value: `${miContext.used} learnings injected from ${miContext.totalSignals} prior signals · variation ${variationNumber} · ${pricingData.complexity} complexity`,
        learning: 'Each generation enriches the dataset; downstream production telemetry will close the loop.',
        confidence: 80,
        source: 'design_generation',
        metadata: {
          variationNumber,
          hasSketch: !!sketchImageBase64,
          hasRoomImage: !!roomImageBase64,
          generate3D,
          pricePerCubicFoot: pricingData.pricePerCubicFoot,
        },
      });
    } catch (logErr) {
      console.error('Flywheel log failed (non-blocking):', logErr);
    }

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        taskId: taskId,
        has3DSupport: !!taskId,
        polling: !!taskId,
        pricing: pricingData,
        flywheel: miContext,
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
