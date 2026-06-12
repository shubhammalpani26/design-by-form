import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { productName, category, materials, dimensions, type, prompt: customPrompt } = body;
    
    console.log('Request type:', type, 'Category:', category);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let prompt: string;
    let systemContent: string;

    // Handle surprise prompt generation
    if (type === 'surprise_prompt') {
      systemContent = 'You are a wildly creative furniture designer fluent in both traditional craft (solid wood joinery, hand-carved detailing, upholstery, metalwork, stone, glass, rattan, cane) and modern 3D-printed resin/composite work. You design like Beni Enterprise (Mumbai premium woodwork — solid hardwoods, fluted/carved detailing, contemporary silhouettes, statement dining tables, consoles, sofas, lamps) and Cyanique (sculptural additive manufacturing). Generate completely unexpected, never-before-seen designs across any manufacturing method. CRITICAL: every piece must use ONE cohesive, tonal color story (a single palette of 1-2 closely related tones + at most one accent material). Never mix unrelated colors. Every response must be different.';

      const randomSeed = Math.floor(Math.random() * 100000);

      prompt = `SEED: ${randomSeed}

Generate a COMPLETELY RANDOM and UNIQUE design prompt for a ${category || 'furniture'} piece.

BE UNPREDICTABLE in form & inspiration — but DISCIPLINED in palette. Surprise me with something I've never seen, in ONE cohesive color story.

MANUFACTURING FREEDOM (we can make almost anything):
- Premium solid wood (Sheesham, Teak, oak, walnut, mango) with traditional joinery, hand-carved detailing, fluting, reeding, turned legs — dining tables, consoles, shelving, beds, coffee tables, benches (Beni Enterprise capability)
- Designer upholstered furniture on solid wood frames — sofas, lounge chairs, ottomans, headboards, designer lamps (fabric, leather, bouclé, velvet, linen) (Beni Enterprise capability)
- 3D-printed resin/composite for sculptural curved forms — vases, accent pieces, statement decor (Cyanique capability)
- Metalwork — powder-coated steel, brass, blackened iron, stainless
- Multi-material hybrids — wood + metal, stone tops + wood base, upholstered seat + carved wood frame
- Hardware is fine — hinges, soft-close drawers, sliding doors, casters/wheels, reclining mechanisms
- Surface finishes — stained/oiled/lacquered wood, matte/gloss paint, veneer, marble, travertine, glass, rattan/cane, fluting, channel tufting, piping

COLOR DISCIPLINE (non-negotiable):
- Pick ONE tonal family for the entire piece: e.g. "warm walnut throughout", "all bone-white with cream bouclé", "blackened oak with brushed brass accents only", "travertine top on natural oak base", "monochrome charcoal velvet on ebonised wood".
- Maximum TWO closely-related tones + ONE small accent (metal trim, piping, hardware). No rainbow combinations. No clashing hues.
- Name the EXACT finish (e.g. "fumed oak", "champagne bouclé", "antique brass", "honed Carrara") — not vague words like "colorful" or "vibrant".

DESIGN GUIDANCE:
- Pick a real manufacturing direction (carved/turned solid wood OR upholstered-on-wood-frame OR sculpted resin OR metal-framed OR hybrid)
- Match form to material (don't ask for sharp dovetails on a printed resin piece, or organic curves on a flat-pack ply piece)
- Load-bearing must be sensible: chairs 120kg, tables hold objects, beds support a person

FORMAT:
- 2-3 sentences ONLY
- Be SPECIFIC about the form, primary material, and the ONE cohesive finish/palette
- Return ONLY the design prompt, nothing else`;
    } else {
      // Standard product description generation
      systemContent = 'You are a luxury furniture copywriter who creates compelling, story-driven product descriptions that evoke emotion and desire. Your writing is elegant, sophisticated, and makes every piece sound like a masterpiece.';
      
      prompt = `Create a premium, captivating product description for a furniture piece with the following details:

Product Name: ${productName}
Category: ${category}
Materials: ${materials || 'Premium materials'}
Dimensions: ${dimensions ? `${dimensions.width}W x ${dimensions.depth}D x ${dimensions.height}H cm` : 'Custom dimensions'}

Requirements:
- Write a compelling story-like description (150-200 words)
- Emphasize craftsmanship, luxury, and unique design elements
- Use evocative, premium language that appeals to high-end buyers
- Highlight how this piece transforms living spaces
- Focus on the emotional connection and lifestyle enhancement
- Make it sound exclusive and aspirational
- Do NOT use markdown or special formatting
- Write in a flowing, narrative style

The description should make potential buyers feel they're investing in art, not just furniture.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-pro-preview',
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: type === 'surprise_prompt' ? 0.98 : 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content;

    if (!description) {
      throw new Error('No description generated');
    }

    console.log('Generated description:', description);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate description',
        fallback: 'A stunning piece that combines form and function, crafted with meticulous attention to detail. This design brings sophistication and elegance to any space, transforming ordinary rooms into extraordinary living environments.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});